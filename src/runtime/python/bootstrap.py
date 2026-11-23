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
LIBRARY_DIR = "/home/pyodide/yg/"
MAX_CAPTURE = 200_000
# Our own modules that keep state between runs; each has a _reset().
STATEFUL_MODULES = ("turtle", "rover")


def _reset_modules():
    stage._reset()
    for name in STATEFUL_MODULES:
        module = sys.modules.get(name)
        if module is not None and hasattr(module, "_reset") and getattr(module, "__file__", "").startswith(LIBRARY_DIR):
            module._reset()


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
    """True when the error came from one of our libraries (stage, turtle, rover)."""
    frames = traceback.extract_tb(exc.__traceback__)
    return bool(frames) and frames[-1].filename.startswith(LIBRARY_DIR)


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


class _OutOfAnswers(Exception):
    pass


class _Runaway(Exception):
    pass


class Simulation:
    """What happened when a check re-ran the child's program behind the scenes."""

    def __init__(self):
        self.output = ""
        self.ns = {}
        self.drawn = []
        self.error = None  # "TypeName: message", or None
        self.ran_out = False  # the program asked for more answers than the check gave
        self.runaway = False  # the program ran far too long (probably an endless loop)
        self.prompts = []  # what each input() asked
        self.answers_used = 0

    @property
    def finished(self):
        return self.error is None and not self.ran_out and not self.runaway

    def __repr__(self):
        return f"Simulation(finished={self.finished}, error={self.error!r}, answers_used={self.answers_used})"


class _Sink:
    def __init__(self):
        self.parts = []
        self.size = 0

    def write(self, s):
        self.parts.append(s)
        self.size += len(s)
        if self.size > MAX_CAPTURE:
            raise _Runaway()
        return len(s)

    def flush(self):
        pass

    def text(self):
        return "".join(self.parts)


def _snapshot_modules():
    saved = {"history": list(stage._history)}
    rover = sys.modules.get("rover")
    if rover is not None and hasattr(rover, "STATE"):
        import copy

        saved["rover"] = copy.deepcopy(rover.STATE)
    turtle = sys.modules.get("turtle")
    if turtle is not None and hasattr(turtle, "_turtles"):
        saved["turtle"] = (list(turtle._turtles), turtle._default)
    return saved


def _restore_modules(saved):
    stage._history[:] = saved["history"]
    rover = sys.modules.get("rover")
    if "rover" in saved and rover is not None:
        rover.STATE.clear()
        rover.STATE.update(saved["rover"])
    turtle = sys.modules.get("turtle")
    if "turtle" in saved and turtle is not None:
        turtle._turtles[:] = saved["turtle"][0]
        turtle._default = saved["turtle"][1]


def _simulate(code, answers=(), seed=None, max_lines=300_000):
    """Re-run the child's code silently, typing `answers` into each input() in turn."""
    import random

    sim = Simulation()
    feed = [str(a) for a in answers]

    def fake_input(prompt=""):
        prompt = str(prompt)
        sys.stdout.write(prompt)
        sim.prompts.append(prompt)
        if not feed:
            raise _OutOfAnswers()
        value = feed.pop(0)
        sim.answers_used += 1
        sys.stdout.write(value + "\n")
        return value

    lines = [0]

    def tracer(frame, event, arg):
        if event == "line":
            lines[0] += 1
            if lines[0] > max_lines:
                raise _Runaway()
        return tracer

    saved = _snapshot_modules()
    real_input, real_stdout, real_silent = builtins.input, sys.stdout, stage._silent
    sink = _Sink()
    namespace = {"__name__": "__main__", "__file__": CHILD_FILE}
    _reset_modules()
    stage._silent = True
    builtins.input = fake_input
    sys.stdout = sink
    if seed is not None:
        random.seed(seed)
    sys.settrace(tracer)
    try:
        exec(compile(code, CHILD_FILE, "exec"), namespace)
    except _OutOfAnswers:
        sim.ran_out = True
    except _Runaway:
        sim.runaway = True
    except SystemExit:
        pass
    except KeyboardInterrupt:
        raise
    except Exception as exc:  # noqa: BLE001 - the check reports it
        sim.error = f"{type(exc).__name__}: {exc}"
    finally:
        sys.settrace(None)
        stage.flush()
        sim.drawn = list(stage._history)
        builtins.input, sys.stdout, stage._silent = real_input, real_stdout, real_silent
        _restore_modules(saved)
        random.seed()
    sim.output = sink.text()
    sim.ns = namespace
    return sim


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

        def rover_state():
            module = sys.modules.get("rover")
            if module is None or namespace.get("rover") is not module:
                return None
            return dict(module.STATE)

        env = {
            "output": output,
            "drawn": history,
            "ns": namespace,
            "code": code,
            "fail": fail,
            "circles": lambda: [c for c in history if c[0] == "circle"],
            "texts": lambda: [c for c in history if c[0] == "text"],
            "waits": lambda: [c for c in history if c[0] == "wait"],
            "lines": lambda: [c for c in history if c[0] == "line"],
            "sprites": lambda: [c for c in history if c[0] == "sprite"],
            "rects": lambda: [c for c in history if c[0] == "rect"],
            "spoken": lambda: [c[1] for c in history if c[0] == "speak"],
            "rover_state": rover_state,
            # simulate(answers=[...], seed=...) re-runs the child's program behind the scenes.
            "simulate": lambda answers=(), seed=None: _simulate(code, answers, seed),
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
            # Keys ending in _py hold a Python literal (like a list) and may be longer.
            result["remember"] = {str(k): str(v)[: 600 if str(k).endswith("_py") else 60] for k, v in remember.items()}
        return result
    return {"passed": False, "message": f"(Unknown check kind {kind!r})"}


# ---------- Run ----------


def _yg_run(code, check_json=None):
    _reset_modules()
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
