"""rover: drive a Mars rover on the Tinkora stage (the robot simulator).

    import rover
    rover.mission(1)
    rover.forward(4)
    rover.turn("left")

Mars is a grid of squares. Each forward step moves the rover one square and uses
battery. Turning uses a little battery too. Drive into a crater and the rover gets
stuck; drive off the edge of the map and mission control stops you.
"""

import stage as _stage

COLS = 11
ROWS = 6
CELL = 52
X0 = (_stage.WIDTH - COLS * CELL) / 2
Y0 = 52

MOVE_COST = 3
TURN_COST = 1
FRAMES_PER_SQUARE = 6
FRAME_TIME = 0.035

# Facing: 0 = east, 1 = north, 2 = west, 3 = south (turning left adds 1).
_STEPS = {0: (1, 0), 1: (0, -1), 2: (-1, 0), 3: (0, 1)}
_ANGLES = {0: 90, 1: 0, 2: 270, 3: 180}  # sprite angle: the rover sprite points up at 0

MISSIONS = {
    1: {
        "title": "Mission 1 · First drive",
        "start": (1, 3, 0),
        "goal": (5, 3),
        "craters": [],
        "battery": 100,
    },
    2: {
        "title": "Mission 2 · Turn the corner",
        "start": (1, 4, 0),
        "goal": (5, 1),
        "craters": [],
        "battery": 100,
    },
    3: {
        "title": "Mission 3 · Crater ahead",
        "start": (1, 3, 0),
        "goal": (7, 3),
        "craters": [(4, 3)],
        "battery": 100,
    },
    4: {
        "title": "Mission 4 · Crater alley",
        "start": (0, 3, 0),
        "goal": (10, 3),
        "craters": [(2, 3), (5, 3), (8, 3)],
        "battery": 100,
    },
    5: {
        "title": "Mission 5 · Rescue the probe",
        "start": (1, 4, 0),
        "probe": (8, 1),
        "craters": [(4, 4), (4, 3), (6, 1), (7, 2), (2, 1)],
        "battery": 100,
    },
}


class RoverStuck(Exception):
    """The rover drove into a crater."""


class RoverOffMap(Exception):
    """The rover tried to leave the map."""


class BatteryEmpty(Exception):
    """The rover ran out of battery."""


def _fresh():
    return {
        "mission": None,
        "x": 0,
        "y": 0,
        "facing": 0,
        "battery": 100,
        "start_battery": 100,
        "craters": [],
        "goal": None,
        "probe": None,
        "base": None,
        "has_probe": False,
        "reached": False,
        "crashed": False,
        "trail": [],
        "moves": [],
        "complete": False,
    }


STATE = _fresh()


def _reset():
    """Called before every run so each program starts a fresh mission."""
    STATE.clear()
    STATE.update(_fresh())


def _need_mission():
    if STATE["mission"] is None:
        raise RuntimeError("Start a mission first, with a line like  rover.mission(1)")


# ---------- Drawing ----------


def _cell_center(cx, cy):
    return X0 + cx * CELL + CELL / 2, Y0 + cy * CELL + CELL / 2


def _draw(rx=None, ry=None, angle=None, banner=None):
    s = STATE
    _stage.background("#2A1712")
    # Mars ground
    _stage.rect(X0, Y0, COLS * CELL, ROWS * CELL, "#5A2E22")
    for i in range(COLS + 1):
        _stage.line(X0 + i * CELL, Y0, X0 + i * CELL, Y0 + ROWS * CELL, "#6E3A2C", 1)
    for j in range(ROWS + 1):
        _stage.line(X0, Y0 + j * CELL, X0 + COLS * CELL, Y0 + j * CELL, "#6E3A2C", 1)
    for cx, cy in s["craters"]:
        x, y = _cell_center(cx, cy)
        _stage.sprite("crater", x, y, 1.1)
    if s["base"]:
        x, y = _cell_center(*s["base"])
        _stage.sprite("base", x, y, 1)
    if s["goal"]:
        x, y = _cell_center(*s["goal"])
        _stage.sprite("flag", x, y, 1)
    if s["probe"] and not s["has_probe"]:
        x, y = _cell_center(*s["probe"])
        _stage.sprite("probe", x, y, 1)
    for i in range(1, len(s["trail"])):
        (ax, ay), (bx, by) = s["trail"][i - 1], s["trail"][i]
        x1, y1 = _cell_center(ax, ay)
        x2, y2 = _cell_center(bx, by)
        _stage.line(x1, y1, x2, y2, "#E8B98A", 2)
    if rx is None:
        rx, ry = _cell_center(s["x"], s["y"])
    _stage.sprite("rover", rx, ry, 1, _ANGLES[s["facing"]] if angle is None else angle)
    # Top bar: mission name and battery
    _stage.text(X0, 32, MISSIONS[s["mission"]]["title"], size=17, color="cream", align="left", font="mono")
    pct = max(0, s["battery"])
    bar_w = 150
    bx = X0 + COLS * CELL - bar_w - 40
    _stage.rect(bx, 22, bar_w, 20, "#1B0F0C")
    fill = "mint" if pct > 40 else ("butter" if pct > 15 else "coral")
    _stage.rect(bx + 2, 24, (bar_w - 4) * pct / max(1, s["start_battery"]), 16, fill)
    _stage.text(bx + bar_w + 8, 32, f"{pct}%", size=15, color="cream", align="left", font="mono")
    if banner:
        # Along the bottom edge of the map, so the rover and flag stay visible.
        top = Y0 + ROWS * CELL + 4
        _stage.rect(X0, top, COLS * CELL, 30, "#0B1714")
        _stage.text(_stage.WIDTH / 2, top + 15, banner, size=17, color="butter", font="mono")


# ---------- Missions ----------


def mission(number):
    """Set up a mission on the map. Missions go from 1 to 5."""
    if number not in MISSIONS:
        raise ValueError(f"There's no mission {number!r}. Pick a mission from 1 to {len(MISSIONS)}.")
    m = MISSIONS[number]
    _reset()
    x, y, facing = m["start"]
    STATE.update(
        mission=number,
        x=x,
        y=y,
        facing=facing,
        battery=m["battery"],
        start_battery=m["battery"],
        craters=list(m["craters"]),
        goal=m.get("goal"),
        probe=m.get("probe"),
        base=(x, y) if "probe" in m else None,
        trail=[(x, y)],
    )
    _draw()
    _stage.wait(0.4)


def _use(amount):
    STATE["battery"] -= amount
    if STATE["battery"] < 0:
        STATE["battery"] = 0
        _draw(banner="Battery empty!")
        _stage.flush()
        raise BatteryEmpty("The rover's battery ran out before the mission was done. Find a shorter route, with fewer squares and turns.")


def forward(squares=1):
    """Drive forward this many squares."""
    _need_mission()
    if isinstance(squares, bool) or not isinstance(squares, int):
        raise TypeError(f"forward() needs a whole number of squares, like rover.forward(3), not {squares!r}")
    if squares < 0:
        raise ValueError("forward() needs 0 or more squares. To go the other way, turn around first.")
    s = STATE
    dx, dy = _STEPS[s["facing"]]
    for _ in range(squares):
        nx, ny = s["x"] + dx, s["y"] + dy
        if not (0 <= nx < COLS and 0 <= ny < ROWS):
            _draw(banner="Edge of the map!")
            _stage.flush()
            raise RoverOffMap(
                f"Mission control stopped the rover at the edge of the map (square {s['x']}, {s['y']}). Count the squares again."
            )
        _use(MOVE_COST)
        x1, y1 = _cell_center(s["x"], s["y"])
        x2, y2 = _cell_center(nx, ny)
        for f in range(1, FRAMES_PER_SQUARE + 1):
            t = f / FRAMES_PER_SQUARE
            _draw(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)
            _stage.wait(FRAME_TIME)
        s["x"], s["y"] = nx, ny
        s["trail"].append((nx, ny))
        s["moves"].append(("forward", nx, ny))
        if (nx, ny) in s["craters"]:
            s["crashed"] = True
            _draw(banner="Stuck in a crater!")
            _stage.flush()
            raise RoverStuck("The rover drove into a crater and got stuck! Steer around the craters: turn, drive past, then turn back.")
        _arrive()


def turn(direction):
    """Turn the rover "left" or "right" (a quarter turn)."""
    _need_mission()
    d = str(direction).strip().lower()
    if d not in ("left", "right"):
        raise ValueError(f'turn() needs "left" or "right" in quotes, not {direction!r}')
    _use(TURN_COST)
    s = STATE
    start = _ANGLES[s["facing"]]
    s["facing"] = (s["facing"] + (1 if d == "left" else 3)) % 4
    end = _ANGLES[s["facing"]]
    delta = ((end - start + 180) % 360) - 180
    for f in range(1, 4):
        _draw(angle=start + delta * f / 3)
        _stage.wait(FRAME_TIME)
    s["moves"].append(("turn", d))


def battery():
    """How much battery is left, as a number from 0 to 100."""
    return STATE["battery"]


def scan():
    """Look at the square straight ahead: returns "crater", "edge" or "clear"."""
    _need_mission()
    s = STATE
    dx, dy = _STEPS[s["facing"]]
    nx, ny = s["x"] + dx, s["y"] + dy
    if not (0 <= nx < COLS and 0 <= ny < ROWS):
        return "edge"
    return "crater" if (nx, ny) in s["craters"] else "clear"


def _arrive():
    s = STATE
    here = (s["x"], s["y"])
    if s["probe"] and not s["has_probe"] and here == s["probe"]:
        s["has_probe"] = True
        _draw(banner="Probe picked up! Now drive home.")
        _stage.wait(0.8)
    if s["goal"] and here == s["goal"] and not s["reached"]:
        s["reached"] = True
        s["complete"] = True
        _draw(banner=f"Mission complete! {s['battery']}% battery left")
        _stage.flush()
    if s["base"] and s["has_probe"] and here == s["base"] and not s["reached"]:
        s["reached"] = True
        s["complete"] = True
        _draw(banner=f"Rescue complete! {s['battery']}% battery left")
        _stage.flush()
