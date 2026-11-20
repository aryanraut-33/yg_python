# Runs once when the Python worker starts. Defines _yg_run(), which the worker
# calls with the child's code (and optionally a behaviour check). Each run gets a
# fresh namespace.
import builtins
import difflib
import json
import re
import sys
import time
import traceback

sys.path.insert(0, "/home/pyodide/yg")

import stage  # noqa: E402

CHILD_FILE = "main.py"
STAGE_FILE = "/home/pyodide/yg/stage.py"
MAX_CAPTURE = 200_000


def _sleep(seconds):
    stage.wait(seconds)


# time.sleep() behaves like stage.wait(): it shows the drawing so far, and Stop still works.
time.sleep = _sleep


class _Tee:
    """Passes printed text through to the page and keeps a copy for checks."""

    def __init__(self, real):
        self.real = real
        self.parts = []
        self.size = 0

    def write(self, s):
        if self.size < MAX_CAPTURE:
            self.parts.append(s)
            self.size += len(s)
        return self.real.write(s)

    def flush(self):
        return self.real.flush()

    def text(self):
        return "".join(self.parts)

    def __getattr__(self, name):
        return getattr(self.real, name)


class CheckFailed(Exception):
    pass


# ---------- Errors ----------


def _child_line(exc):
    """Line number in the child's main.py where the error happened."""
    if isinstance(exc, SyntaxError) and exc.filename == CHILD_FILE:
        return exc.lineno
    line = None
    for frame in traceback.extract_tb(exc.__traceback__):
        if frame.filename == CHILD_FILE:
            line = frame.lineno
    return line


def _child_traceback(exc):
    """Traceback with our own internals removed, so it only shows the child's code."""
    if isinstance(exc, SyntaxError):
        return "".join(traceback.format_exception_only(type(exc), exc))
    frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == CHILD_FILE]
    lines = ["Traceback (most recent call last):\n"]
    lines += traceback.format_list(frames)
    lines += traceback.format_exception_only(type(exc), exc)
    return "".join(lines)


def _from_stage(exc):
    frames = traceback.extract_tb(exc.__traceback__)
    return bool(frames) and frames[-1].filename == STAGE_FILE


def _suggest(exc, namespace):
    """A close match for a misspelt name, e.g. 'score' for 'scroe'."""
    name = getattr(exc, "name", None)
    if not isinstance(name, str):
        return None
    if isinstance(exc, NameError):
        pool = [n for n in list(namespace) + dir(builtins) if not n.startswith("_")]
    elif isinstance(exc, AttributeError) and getattr(exc, "obj", None) is not None:
        pool = [n for n in dir(exc.obj) if not n.startswith("_")]
    else:
        return None
    matches = difflib.get_close_matches(name, pool, n=1, cutoff=0.6)
    return matches[0] if matches else None


def _describe(exc, namespace):
    message = exc.msg if isinstance(exc, SyntaxError) else str(exc)
    name = getattr(exc, "name", None) if isinstance(exc, (NameError, AttributeError)) else None
    return {
        "type": type(exc).__name__,
        "message": message,
        "line": _child_line(exc),
        "traceback": _child_traceback(exc),
        "name": name if isinstance(name, str) else None,
        "suggestion": _suggest(exc, namespace),
        "fromStage": _from_stage(exc),
    }


# ---------- Checks ----------


def _run_check(check, namespace, output, code=""):
    kind = check.get("kind")
    description = check.get("description", "")
    if kind == "runs":
        return {"passed": True, "message": description}
    if kind == "output-contains":
        passed = check.get("value", "").lower() in output.lower()
        return {"passed": passed, "message": description if passed else "Not yet: " + description}
    if kind == "output-matches":
        passed = re.search(check.get("value", ""), output, re.MULTILINE) is not None
        return {"passed": passed, "message": description if passed else "Not yet: " + description}
    if kind == "python":
        history = list(stage._history)

        def fail(message):
            raise CheckFailed(message)

        env = {
            "output": output,
            "drawn": history,
            "ns": namespace,
            "code": code,
            "fail": fail,
            "circles": lambda: [c for c in history if c[0] == "circle"],
            "texts": lambda: [c for c in history if c[0] == "text"],
            "waits": lambda: [c for c in history if c[0] == "wait"],
        }
        try:
            exec(compile(check.get("code", ""), "check.py", "exec"), env)
        except CheckFailed as exc:
            return {"passed": False, "message": str(exc)}
        except Exception as exc:  # noqa: BLE001 - a broken check must never crash the run
            return {"passed": False, "message": f"(The checker itself had a problem: {type(exc).__name__}: {exc})"}
        result = {"passed": True, "message": description}
        # A check may set `remember = {"name": ...}` to carry values into later steps.
        remember = env.get("remember")
        if isinstance(remember, dict):
            result["remember"] = {str(k): str(v)[:60] for k, v in remember.items()}
        return result
    return {"passed": False, "message": f"(Unknown check kind {kind!r})"}


# ---------- Run ----------


def _yg_run(code, check_json=None):
    stage._reset()
    namespace = {"__name__": "__main__", "__file__": CHILD_FILE}
    tee = _Tee(sys.stdout)
    sys.stdout = tee
    try:
        try:
            exec(compile(code, CHILD_FILE, "exec"), namespace)
        except SystemExit:
            pass
        stage.flush()
        check = None
        if check_json:
            check = _run_check(json.loads(check_json), namespace, tee.text(), code)
        return json.dumps({"ok": True, "stopped": False, "error": None, "check": check})
    except KeyboardInterrupt:
        stage._discard()
        return json.dumps({"ok": False, "stopped": True, "error": None, "check": None})
    except BaseException as exc:  # noqa: BLE001 - report every error to the child
        try:
            stage.flush()
        except BaseException:  # noqa: BLE001
            stage._discard()
        return json.dumps({"ok": False, "stopped": False, "error": _describe(exc, namespace), "check": None})
    finally:
        sys.stdout = tee.real
