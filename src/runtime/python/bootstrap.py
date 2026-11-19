# Runs once when the Python worker starts. Defines _yg_run(), which the worker
# calls with the child's code. Each run gets a fresh namespace.
import json
import sys
import time
import traceback

sys.path.insert(0, "/home/pyodide/yg")

import stage  # noqa: E402

CHILD_FILE = "main.py"


def _sleep(seconds):
    stage.wait(seconds)


# time.sleep() behaves like stage.wait(): it shows the drawing so far, and Stop still works.
time.sleep = _sleep


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


def _yg_run(code):
    stage._reset()
    namespace = {"__name__": "__main__", "__file__": CHILD_FILE}
    try:
        exec(compile(code, CHILD_FILE, "exec"), namespace)
        stage.flush()
        return json.dumps({"ok": True, "stopped": False, "error": None})
    except KeyboardInterrupt:
        stage._discard()
        return json.dumps({"ok": False, "stopped": True, "error": None})
    except SystemExit:
        stage.flush()
        return json.dumps({"ok": True, "stopped": False, "error": None})
    except BaseException as exc:  # noqa: BLE001 - report every error to the child
        try:
            stage.flush()
        except BaseException:  # noqa: BLE001
            stage._discard()
        message = exc.msg if isinstance(exc, SyntaxError) else str(exc)
        return json.dumps(
            {
                "ok": False,
                "stopped": False,
                "error": {
                    "type": type(exc).__name__,
                    "message": message,
                    "line": _child_line(exc),
                    "traceback": _child_traceback(exc),
                },
            }
        )
