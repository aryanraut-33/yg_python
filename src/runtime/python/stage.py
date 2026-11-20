"""stage: draw and animate on the yg python stage.

The stage is 640 wide and 400 tall. (0, 0) is the top-left corner,
x grows to the right and y grows downwards.

    import stage
    stage.background("night")
    stage.circle(320, 200, 50, "butter", glow=True)
    stage.text(320, 200, "Hi!", size=40, color="pine")
    stage.wait(1)

Drawing is collected and shown on screen when the program calls
stage.wait() (or time.sleep()), or when it finishes.
"""

import random as _random

import _yg

WIDTH = 640
HEIGHT = 400

COLORS = {
    # Night Workshop palette
    "butter": "#FFD66B",
    "coral": "#FF8A65",
    "mint": "#7BE0C3",
    "blossom": "#FFB4D2",
    "sky": "#8CC8FF",
    "lilac": "#C9B6FF",
    "cream": "#F5ECDC",
    "night": "#0B1714",
    "pine": "#0F1F1C",
    # Everyday names kids will try
    "white": "#FFFFFF",
    "black": "#000000",
    "red": "#FF5A5A",
    "orange": "#FFA94D",
    "yellow": "#FFE066",
    "green": "#5CD68A",
    "blue": "#5AA9FF",
    "purple": "#B07CFF",
    "pink": "#FF8FC8",
    "brown": "#A9744F",
    "grey": "#9AA8A2",
    "gray": "#9AA8A2",
}

# Bright colours that look good as lights (used by random_color()).
LIGHT_COLORS = ["butter", "coral", "mint", "blossom", "sky", "lilac"]

_FONTS = ("sans", "serif", "mono")
_ALIGNS = ("left", "center", "right")
_MAX_BATCH = 2000

_MAX_HISTORY = 20000

_batch = []
_background = COLORS["night"]
# Everything drawn during this run, for behaviour checks.
_history = []


def _record(command):
    if len(_history) < _MAX_HISTORY:
        _history.append(command)


def _push(command):
    _batch.append(command)
    _record(command)
    if len(_batch) >= _MAX_BATCH:
        flush()


def _color(value, what="colour"):
    if isinstance(value, str):
        key = value.strip().lower()
        if key in COLORS:
            return COLORS[key]
        if key.startswith("#") and len(key) in (4, 7):
            try:
                int(key[1:], 16)
                return key
            except ValueError:
                pass
        names = ", ".join(f'"{n}"' for n in LIGHT_COLORS + ["cream", "night", "red", "blue", "green"])
        raise ValueError(f'The stage doesn\'t know the {what} "{value}". Try one of: {names}')
    if isinstance(value, (tuple, list)) and len(value) == 3:
        r, g, b = (max(0, min(255, int(v))) for v in value)
        return f"#{r:02x}{g:02x}{b:02x}"
    raise TypeError(f'The {what} should be a name like "butter", not {value!r}')


def _num(name, value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(f"{name} should be a number, not {value!r}")
    return round(float(value), 2)


def flush():
    """Send everything drawn so far to the screen."""
    global _batch
    if _batch:
        import json

        _yg.stage_flush(json.dumps(_batch))
        _batch = []


def _discard():
    global _batch
    _batch = []


def _reset():
    global _batch, _background
    _batch = []
    _history.clear()
    _background = COLORS["night"]
    _push(["bg", _background])


def background(color="night"):
    """Fill the whole stage with a colour, wiping everything drawn on it."""
    global _background
    _background = _color(color)
    _push(["bg", _background])


def clear():
    """Wipe the stage back to its background colour."""
    _push(["bg", _background])


def circle(x, y, radius, color="butter", glow=False):
    """Draw a filled circle centred on (x, y). glow=True makes it shine like a light."""
    _push(["circle", _num("x", x), _num("y", y), abs(_num("radius", radius)), _color(color), bool(glow)])


def rect(x, y, width, height, color="mint", round=0):
    """Draw a filled rectangle with its top-left corner at (x, y)."""
    _push(
        [
            "rect",
            _num("x", x),
            _num("y", y),
            _num("width", width),
            _num("height", height),
            _color(color),
            max(0.0, _num("round", round)),
        ]
    )


def line(x1, y1, x2, y2, color="cream", thickness=2):
    """Draw a straight line from (x1, y1) to (x2, y2)."""
    _push(
        [
            "line",
            _num("x1", x1),
            _num("y1", y1),
            _num("x2", x2),
            _num("y2", y2),
            _color(color),
            max(0.5, _num("thickness", thickness)),
        ]
    )


def text(x, y, words, size=32, color="cream", align="center", font="sans", glow=False):
    """Write words centred on (x, y). font can be "sans", "serif" or "mono"."""
    if font not in _FONTS:
        raise ValueError(f'font should be "sans", "serif" or "mono", not {font!r}')
    if align not in _ALIGNS:
        raise ValueError(f'align should be "left", "center" or "right", not {align!r}')
    _push(
        [
            "text",
            _num("x", x),
            _num("y", y),
            str(words),
            max(4.0, _num("size", size)),
            _color(color),
            align,
            font,
            bool(glow),
        ]
    )


def wait(seconds):
    """Show the drawing so far, then pause for this many seconds."""
    seconds = _num("seconds", seconds)
    if seconds < 0:
        raise ValueError("wait() needs a number of seconds that is 0 or more")
    _record(["wait", seconds])
    flush()
    _yg.sleep(seconds)


def random_color():
    """Pick a random bright light colour, like "mint" or "coral"."""
    return _random.choice(LIGHT_COLORS)
