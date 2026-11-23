"""turtle: a lookalike of Python's turtle module that draws on the Tinkora stage.

Python's own turtle needs a desktop window, which a browser doesn't have, so this
module offers the same everyday commands and draws with stage.line().

    import turtle
    t = turtle.Turtle()
    for side in range(4):
        t.forward(100)
        t.right(90)

Like the real turtle, (0, 0) is the middle of the stage, x grows to the right
and y grows upwards. The turtle starts facing right (east).
"""

import math as _math

import stage as _stage

__all__ = [
    "Turtle",
    "Screen",
    "forward",
    "fd",
    "back",
    "bk",
    "backward",
    "right",
    "rt",
    "left",
    "lt",
    "penup",
    "pu",
    "up",
    "pendown",
    "pd",
    "down",
    "goto",
    "setpos",
    "setposition",
    "setheading",
    "seth",
    "home",
    "color",
    "pencolor",
    "width",
    "pensize",
    "speed",
    "circle",
    "dot",
    "bgcolor",
    "hideturtle",
    "ht",
    "showturtle",
    "st",
    "position",
    "pos",
    "heading",
    "xcor",
    "ycor",
    "clear",
    "done",
    "mainloop",
    "exitonclick",
]

# Pixels the turtle travels per second at each speed (1 slowest ... 10 fastest; 0 is instant).
_PIXELS_PER_SECOND = {1: 120, 2: 200, 3: 300, 4: 420, 5: 560, 6: 760, 7: 1000, 8: 1400, 9: 2000, 10: 3000}
_DEFAULT_SPEED = 8
_FLUSH_EVERY = 24  # pixels of travel between screen updates


def _to_stage(x, y):
    return _stage.WIDTH / 2 + x, _stage.HEIGHT / 2 - y


class Turtle:
    """A turtle that draws lines on the stage as it moves."""

    def __init__(self):
        self._x = 0.0
        self._y = 0.0
        self._heading = 0.0  # degrees, 0 = east, counter-clockwise like the real turtle
        self._down = True
        self._color = "mint"
        self._width = 2.0
        self._speed = _DEFAULT_SPEED
        self._visible = True
        self._travel = 0.0
        _turtles.append(self)
        self._show()

    # ----- moving -----

    def forward(self, distance):
        """Move forward this many steps, drawing a line if the pen is down."""
        d = _stage._num("distance", distance)
        rad = _math.radians(self._heading)
        self._move_to(self._x + d * _math.cos(rad), self._y + d * _math.sin(rad))

    fd = forward

    def back(self, distance):
        """Move backwards without turning around."""
        self.forward(-_stage._num("distance", distance))

    bk = back
    backward = back

    def right(self, angle):
        """Turn right (clockwise) by this many degrees."""
        self._heading = (self._heading - _stage._num("angle", angle)) % 360
        self._show()

    rt = right

    def left(self, angle):
        """Turn left (anticlockwise) by this many degrees."""
        self._heading = (self._heading + _stage._num("angle", angle)) % 360
        self._show()

    lt = left

    def goto(self, x, y=None):
        """Move straight to the point (x, y)."""
        if y is None and isinstance(x, (tuple, list)) and len(x) == 2:
            x, y = x
        self._move_to(_stage._num("x", x), _stage._num("y", y))

    setpos = goto
    setposition = goto

    def setheading(self, angle):
        """Face a direction: 0 is right, 90 is up, 180 is left, 270 is down."""
        self._heading = _stage._num("angle", angle) % 360
        self._show()

    seth = setheading

    def home(self):
        """Go back to the middle of the stage, facing right."""
        self.goto(0, 0)
        self.setheading(0)

    def circle(self, radius, extent=None, steps=None):
        """Draw a circle (or part of one when extent is less than 360) to the turtle's left."""
        r = _stage._num("radius", radius)
        ext = 360.0 if extent is None else _stage._num("extent", extent)
        n = steps or max(12, min(90, int(abs(r) * abs(ext) / 360 / 3) + 12))
        step_angle = ext / n
        step_len = 2 * abs(r) * _math.sin(_math.radians(abs(step_angle)) / 2)
        turn = step_angle if r >= 0 else -step_angle
        self.left(turn / 2)
        for _ in range(n):
            self.forward(step_len)
            self.left(turn)
        self.left(-turn / 2)

    def dot(self, size=10, color=None):
        """Draw a round dot where the turtle is."""
        x, y = _to_stage(self._x, self._y)
        _stage.circle(x, y, _stage._num("size", size) / 2, color if color is not None else self._color)
        self._show()

    # ----- the pen -----

    def penup(self):
        """Lift the pen: moving no longer draws."""
        self._down = False

    pu = penup
    up = penup

    def pendown(self):
        """Put the pen down: moving draws a line again."""
        self._down = True

    pd = pendown
    down = pendown

    def color(self, *colors):
        """Set the pen colour, for example t.color("coral")."""
        if colors:
            _stage._color(colors[0])  # check the name now, with a friendly message
            self._color = colors[0]
            self._show()
        return self._color

    pencolor = color

    def width(self, size=None):
        """Set how thick the lines are."""
        if size is not None:
            self._width = max(0.5, _stage._num("width", size))
        return self._width

    pensize = width

    def speed(self, value=None):
        """How fast the turtle moves: 1 (slow) to 10 (fast), or 0 for instant."""
        if value is None:
            return self._speed
        if isinstance(value, str):
            value = {"slowest": 1, "slow": 3, "normal": 6, "fast": 10, "fastest": 0}.get(value.lower(), _DEFAULT_SPEED)
        v = int(_stage._num("speed", value))
        self._speed = max(0, min(10, v))
        return self._speed

    def hideturtle(self):
        self._visible = False
        self._show()

    ht = hideturtle

    def showturtle(self):
        self._visible = True
        self._show()

    st = showturtle

    # ----- asking where it is -----

    def position(self):
        return (round(self._x, 2), round(self._y, 2))

    pos = position

    def xcor(self):
        return round(self._x, 2)

    def ycor(self):
        return round(self._y, 2)

    def heading(self):
        return round(self._heading, 2)

    def clear(self):
        _stage.clear()

    # ----- inside -----

    def _move_to(self, nx, ny):
        if self._down:
            x1, y1 = _to_stage(self._x, self._y)
            x2, y2 = _to_stage(nx, ny)
            _stage.line(x1, y1, x2, y2, self._color, self._width)
        dist = _math.hypot(nx - self._x, ny - self._y)
        self._x, self._y = nx, ny
        self._show()
        if self._speed > 0:
            self._travel += dist
            if self._travel >= _FLUSH_EVERY:
                _stage.wait(self._travel / _PIXELS_PER_SECOND[self._speed])
                self._travel = 0.0

    def _show(self):
        x, y = _to_stage(self._x, self._y)
        _stage._push(["turtle", round(x, 2), round(y, 2), round(self._heading, 2), self._visible, _stage._color(self._color)])


class _Screen:
    """The drawing window. Only the parts that make sense on the stage."""

    def bgcolor(self, color=None):
        if color is not None:
            _stage.background(color)

    def title(self, words=None):
        pass

    def setup(self, *args, **kwargs):
        pass

    def tracer(self, *args, **kwargs):
        pass

    def update(self):
        _stage.flush()

    def mainloop(self):
        pass

    def exitonclick(self):
        pass

    done = mainloop


_screen = _Screen()
_turtles = []
_default = None


def Screen():
    return _screen


def _pen():
    global _default
    if _default is None:
        _default = Turtle()
    return _default


def _reset():
    """Called before every run so each program starts with a fresh turtle."""
    global _default
    _turtles.clear()
    _default = None


def _make(name):
    def command(*args, **kwargs):
        return getattr(_pen(), name)(*args, **kwargs)

    command.__name__ = name
    command.__doc__ = getattr(Turtle, name).__doc__
    return command


for _name in __all__:
    if _name not in ("Turtle", "Screen", "bgcolor", "done", "mainloop", "exitonclick"):
        globals()[_name] = _make(_name)


def bgcolor(color=None):
    """Fill the stage with a colour."""
    _screen.bgcolor(color)


def done():
    """Finish drawing. (On the stage this does nothing, but programs often end with it.)"""
    _stage.flush()


mainloop = done
exitonclick = done
