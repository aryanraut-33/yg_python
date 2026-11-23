"""stage: draw and animate on the Tinkora stage.

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
    # Names turtle programs often use
    "gold": "#FFC94D",
    "cyan": "#5BE0F0",
    "magenta": "#FF5FD2",
    "violet": "#A98BFF",
    "indigo": "#6C6CFF",
    "lime": "#B6F25C",
    "teal": "#3FC1B0",
    "navy": "#2E4A8C",
    "silver": "#C9D1CE",
    "maroon": "#B5475B",
}

# Bright colours that look good as lights (used by random_color()).
LIGHT_COLORS = ["butter", "coral", "mint", "blossom", "sky", "lilac"]

_FONTS = ("sans", "serif", "mono")
_ALIGNS = ("left", "center", "right")
_MAX_BATCH = 2000

_MAX_HISTORY = 20000

_batch = []
_background = COLORS["night"]
# True while a behaviour check re-runs the child's program behind the scenes:
# drawing is still recorded, but nothing is sent to the screen and waits are skipped.
_silent = False
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
    if _batch and not _silent:
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
    if not _silent:
        _yg.sleep(seconds)


def random_color():
    """Pick a random bright light colour, like "mint" or "coral"."""
    return _random.choice(LIGHT_COLORS)


# ---------- Sprites: little ready-made pictures ----------

SPRITES = (
    "rocket",
    "flame",
    "smoke",
    "star",
    "planet",
    "moon",
    "cloud",
    "heart",
    "coin",
    "rover",
    "probe",
    "base",
    "crater",
    "flag",
)


def sprite(name, x, y, size=1, angle=0):
    """Draw a ready-made picture centred on (x, y), such as "rocket" or "star".

    size=2 makes it twice as big. angle turns it (in degrees, clockwise).
    """
    key = str(name).strip().lower()
    if key not in SPRITES:
        names = ", ".join(f'"{n}"' for n in SPRITES)
        raise ValueError(f'The stage doesn\'t have a sprite called "{name}". Try one of: {names}')
    _push(["sprite", key, _num("x", x), _num("y", y), max(0.1, _num("size", size)), _num("angle", angle)])


# ---------- Speech ----------


def speak(words):
    """Read words out loud using the computer's voice (nothing leaves the device)."""
    words = str(words)[:600]
    _push(["speak", words])


# ---------- Charts ----------


def bar_chart(values, labels=None, color="mint", goal=None, title=None, highlight=None):
    """Draw a bar chart that fills the stage.

    values:    a list of numbers, one bar each
    labels:    a list of words under the bars (optional)
    goal:      a number to draw as a dashed target line (optional)
    title:     words at the top (optional)
    highlight: the position of one bar to draw in a different colour (optional)
    """
    if not isinstance(values, (list, tuple)) or len(values) == 0:
        raise TypeError("bar_chart() needs a list of numbers, like [50, 80, 120]")
    nums = [_num(f"values[{i}]", v) for i, v in enumerate(values)]
    if labels is not None and len(labels) != len(nums):
        raise ValueError(f"bar_chart() got {len(nums)} values but {len(labels)} labels. They should match.")
    bar_color = _color(color)
    top = max(nums + ([_num("goal", goal)] if goal is not None else []) + [1])
    left, right, y_top, y_base = 56.0, 616.0, 64.0 if title else 34.0, 340.0
    plot_h = y_base - y_top
    if title:
        text(WIDTH / 2, 30, title, size=22, color="cream")
    line(left, y_base, right, y_base, "grey", 2)
    slot = (right - left) / len(nums)
    width = max(4.0, slot * 0.62)
    for i, v in enumerate(nums):
        h = max(0.0, v) / top * plot_h
        x = left + slot * i + (slot - width) / 2
        fill = COLORS["coral"] if highlight == i else bar_color
        _push(["rect", round(x, 2), round(y_base - h, 2), round(width, 2), round(h, 2), fill, 0.0])
        if len(nums) <= 16:
            shown = int(v) if float(v).is_integer() else round(v, 1)
            text(x + width / 2, y_base - h - 12, shown, size=13, color="cream", font="mono")
        if labels is not None and len(nums) <= 16:
            text(x + width / 2, y_base + 18, labels[i], size=12, color="grey", font="mono")
    if goal is not None:
        gy = y_base - _num("goal", goal) / top * plot_h
        x = left
        while x < right:
            line(x, gy, min(x + 10, right), gy, "butter", 2)
            x += 18
        text(right, gy - 12, f"goal {goal}", size=13, color="butter", align="right", font="mono")
