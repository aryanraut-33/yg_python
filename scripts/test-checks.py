"""Runs each project's behaviour checks in local CPython.

For every step with a check, the step's starting code should FAIL (where listed)
and the sample answer should PASS. Every solution (and preview) must run without
errors. Run with:  npm run test:checks
"""
import builtins
import itertools
import json
import pathlib
import re
import sys
import types

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src" / "runtime" / "python"))

fake = types.ModuleType("_yg")
fake.sleep = lambda s: None
fake.stage_flush = lambda batch: None
sys.modules["_yg"] = fake

namespace = {}
exec((ROOT / "src" / "runtime" / "python" / "bootstrap.py").read_text(), namespace)
run = namespace["_yg_run"]
PROJECTS = ROOT / "content" / "projects"


# ---------- What gets typed into input() during a run ----------
_feed = iter(())


def feed(values):
    """Answers typed into input(), in order. A generator can go on for ever."""
    global _feed
    _feed = iter(values)


def _input(prompt=""):
    print(prompt, end="")
    try:
        return str(next(_feed))
    except StopIteration:
        return "cat"


builtins.input = _input
COUNT_UP = lambda: itertools.cycle(range(1, 101))  # noqa: E731 - guesses 1, 2, 3 … until one is right


def fill(src, remembered=None):
    """The same templating as fillTemplate() in Sandbox.tsx."""
    remembered = remembered or {}

    def sub(m):
        key, fallback = m.group(1), m.group(2)
        value = remembered.get(key, fallback if fallback is not None else ("AARAV" if key == "name" else ""))
        return value if key.endswith("_py") else value.replace('"', "").replace("\\", "")

    return re.sub(r"\{\{(\w+)(?:\|([^}]*))?\}\}", sub, src)


def step_file(project, file_name, **remembered):
    return fill((PROJECTS / project / file_name).read_text(), {k: str(v) for k, v in remembered.items()})


# ---------- Cases: step id -> (code that should fail or None, code that should pass[, typed answers]) ----------
nls = lambda f, name="AARAV": step_file("name-light-show", f, name=name)  # noqa: E731

rl = lambda f: step_file("rocket-launch", f)  # noqa: E731
rl_fly = rl("step-6-fill.py").replace("___", "20")
rl_fire = rl_fly.replace(
    '    stage.sprite("rocket", 320, y, 2)\n    y = y',
    '    stage.sprite("flame", 320, y + 60, 2)\n    stage.sprite("rocket", 320, y, 2)\n    y = y',
)

sa = lambda f: step_file("spiral-art", f)  # noqa: E731
sa_colours = sa("step-6-fill.py").replace("___", "colours")

gm = lambda f: step_file("guess-my-number", f)  # noqa: E731
gm_hints = gm("step-3-predict.py").replace(
    'else:\n    print("Nope!")', 'elif guess < secret:\n    print("Higher!")\nelse:\n    print("Lower!")'
)
gm_loop = gm("step-5-fill.py").replace("___", "!=")

sm = lambda f, **r: step_file("story-machine", f, **r)  # noqa: E731
sm_own = (
    sm("step-2-predict.py")
    .replace('["a brave cat", "Dadi", "a tiny robot"]', '["my cousin Ria", "a sleepy lion", "Captain Chai"]')
    .replace('["the moon", "a mango tree", "a busy Mumbai station"]', '["Goa beach", "a secret cave", "the school bus"]')
)
sm_problems = sm_own + (
    'problems = ["lost their shoes", "met a grumpy elephant", "forgot the way home"]\n'
    "problem = random.choice(problems)\n"
    'print(f"But oh no, {hero} {problem}!")\n'
)
sm_twists = sm_problems + (
    'twists = ["a dragon said sorry", "it was all a dream", "everyone got ice cream"]\n'
    "twist = random.choice(twists)\n"
    'print(f"Then, {twist}.")\n'
)
SM_MEM = {"heroes_py": "['my cousin Ria', 'a sleepy lion', 'Captain Chai']"}
sm_speak = sm("step-7-fill.py", **SM_MEM).replace("stage.___(story)", "stage.speak(story)")

pm = lambda f, **r: step_file("pocket-money-tracker", f, **r)  # noqa: E731
pm_finish = pm("step-7-fill.py", item="skateboard", goal=2500).replace("___", "<")

mr = lambda f: step_file("mars-rover-rescue", f)  # noqa: E731
mr_go = mr("step-6-fill.py").replace("___", "go_around()")
mr_loop = mr_go.split("rover.forward(1)\ngo_around()")[0] + (
    "rover.forward(1)\nfor crater in range(3):\n    go_around()\n    rover.forward(1)\n"
)
mr_slow_rescue = mr("step-8-build.py") + (
    'rover.turn("right")\nrover.forward(1)\nrover.turn("left")\nrover.forward(7)\nrover.turn("left")\nrover.forward(4)\n'
    'rover.turn("left")\nrover.turn("left")\nrover.forward(4)\nrover.turn("right")\nrover.forward(7)\nrover.turn("right")\nrover.forward(1)\n'
)

CASES = {
    "name-light-show": {
        "move-light": (nls("step-1-predict.py"), nls("step-1-predict.py").replace("320", "100")),
        "light-colour": (
            nls("step-1-predict.py").replace("320", "100"),
            nls("step-1-predict.py").replace('"butter"', '"mint"'),
        ),
        "your-name": (nls("step-4-predict.py"), nls("step-4-predict.py").replace("AARAV", "Meera")),
        "spread-lights": (
            nls("step-7-build.py", "MEERA"),
            nls("step-7-build.py", "MEERA") + "    x = x + 60\n",
        ),
        "flashing": (
            nls("step-8-fill.py", "MEERA").replace("___", "2"),
            nls("step-8-fill.py", "MEERA").replace("___", "8"),
        ),
        "make-it-yours": (
            nls("step-8-fill.py", "MEERA").replace("___", "8"),
            nls("step-8-fill.py", "MEERA").replace("___", "8").replace("0.4", "0.15"),
        ),
    },
    "rocket-launch": {
        "predict-countdown": (None, rl("step-1-predict.py")),
        "add-wait": (rl("step-1-predict.py"), rl("step-1-predict.py") + "    stage.wait(0.5)\n"),
        "fill-number": (rl("step-3-fill.py"), rl("step-3-fill.py").replace("___", "n")),
        "last-five": (rl("step-4-predict.py"), rl("step-4-predict.py").replace("n <= 3", "n <= 5")),
        "fly": (rl("step-6-fill.py").replace("___", "5"), rl_fly),
        "fire": (rl_fly, rl_fire),
        "name-rocket": (rl_fire, rl_fire.replace("Mission Dadi", "Mission Moon")),
    },
    "spiral-art": {
        "square": (sa("step-1-predict.py"), sa("step-1-predict.py") + "t.right(90)\nt.forward(100)\nt.right(90)\nt.forward(100)\n"),
        "triangle": (sa("step-3-fill.py").replace("___", "90"), sa("step-3-fill.py").replace("___", "120")),
        "bend": (sa("step-4-predict.py"), sa("step-4-predict.py").replace("right(90)", "right(91)")),
        "random-colours": (sa("step-6-fill.py").replace("___", '["mint"]'), sa_colours),
        "your-design": (sa_colours, sa_colours.replace("right(91)", "right(121)")),
    },
    "guess-my-number": {
        "predict-random": (None, gm("step-1-predict.py")),
        "keep-secret": (
            gm("step-1-predict.py"),
            'import random\n\nsecret = random.randint(1, 100)\nprint("I picked a number from 1 to 100.")\n',
        ),
        "hints": (gm("step-3-predict.py"), gm_hints, [50]),
        "loop": (gm("step-5-fill.py").replace("___", "=="), gm_loop, COUNT_UP),
        "count-tries": (gm_loop, gm("solution.py"), COUNT_UP),
        "your-machine": (None, gm("step-7-predict.py").replace("high = 100", "high = 1000"), ["higher", "lower", "yes"]),
    },
    "story-machine": {
        "predict-list": (None, sm("step-1-predict.py")),
        "predict-sentence": (None, sm("step-2-predict.py")),
        "own-lists": (sm("step-2-predict.py"), sm_own),
        "problems": (sm_own, sm_problems),
        "twists": (sm_problems, sm_twists),
        "two-stories": (sm("step-6-fill.py", **SM_MEM), sm("step-6-fill.py", **SM_MEM).replace("___", "tell_story()")),
        "speak": (sm("step-7-fill.py", **SM_MEM).replace("stage.___", "stage.text"), sm_speak),
        "family-hero": (sm_speak, sm_speak.replace("'Captain Chai']", "'Captain Chai', 'Chintu bhaiya']")),
    },
    "pocket-money-tracker": {
        "predict-need": (None, pm("step-1-predict.py")),
        "your-goal": (pm("step-1-predict.py"), pm("step-1-predict.py").replace("cricket bat", "skateboard").replace("800", "2500")),
        "predict-sum": (None, pm("step-3-predict.py", item="skateboard", goal=2500)),
        "log-money": (
            pm("step-3-predict.py", item="skateboard", goal=2500),
            pm("step-3-predict.py", item="skateboard", goal=2500)
            .replace("[100, 50, 200, 50]", "[100, 50, 200, 50, 100, 500]")
            .replace("[30, 20]", "[30, 20, 40]"),
        ),
        "draw-chart": (
            pm("step-5-fill.py", item="skateboard", goal=2500).replace("___", "weekly"),
            pm("step-5-fill.py", item="skateboard", goal=2500).replace("___", "totals"),
        ),
        "finish-week": (pm("step-7-fill.py", item="skateboard", goal=2500).replace("___", ">"), pm_finish),
        "your-plan": (pm_finish, pm_finish.replace("[100, 50, 200, 50, 80, 120]", "[150, 150, 200, 150, 200, 150]")),
    },
    "mars-rover-rescue": {
        "reach-flag": (mr("step-1-predict.py"), mr("step-1-predict.py").replace("forward(2)", "forward(4)")),
        "turn-corner": (mr("step-3-build.py"), mr("step-3-build.py") + 'rover.turn("left")\nrover.forward(3)\n'),
        "dodge": (
            mr("step-5-build.py"),
            mr("step-5-build.py")
            + 'rover.turn("left")\nrover.forward(1)\nrover.turn("right")\nrover.forward(2)\n'
            + 'rover.turn("right")\nrover.forward(1)\nrover.turn("left")\nrover.forward(2)\n',
        ),
        "go-around": (mr("step-6-fill.py"), mr_go),
        "loop-it": (mr_go, mr_loop),
        "rescue": (mr("step-8-build.py"), mr_slow_rescue),
        "battery-record": (mr_slow_rescue, mr("solution.py")),
    },
}

# Typed answers while each project's solution and preview run.
SOLUTION_FEEDS = {"guess-my-number": COUNT_UP}

# Onboarding (Speak Python) challenges: (starter that should fail, answer that should pass)
OB = ROOT / "content" / "onboarding"
ONBOARDING = {
    "check-print.py": ('print("Hi Riff!")\n', 'print("Hi Riff!")\nprint("Hi Nix!")\n'),
    "check-strings.py": ('print("Captain")\n', 'print("Captain" + "Comet")\n'),
    "check-numbers.py": ('print(2 + 2)\n', 'print(2 + 2)\nprint("2" + "2")\n'),
    "check-variables.py": ('pet = "Bruno"\n', 'pet = "Bruno"\nprint(pet)\n'),
    "check-math.py": ('slices = 3 + 8\nprint(slices)\n', 'slices = 3 * 8\nprint(slices)\n'),
    "check-comments.py": (
        'print("The movie starts!")\nprint("SPOILER: the robot is the hero")\nprint("The end")\n',
        'print("The movie starts!")\n# print("SPOILER: the robot is the hero")\nprint("The end")\n',
    ),
    "check-input.py": ('print("I love cats")\n', 'animal = input("Favourite animal? ")\nprint("I love", animal)\n'),
    "check-tour-hello.py": ('print("Hello World")\n', 'print("Hello, World!")\n'),
}

failures = 0


def report(ok, label, msg):
    global failures
    if not ok:
        failures += 1
    print(f"{'ok ' if ok else 'BAD'} {label}  {msg}")


for f, (bad, good) in ONBOARDING.items():
    check = json.dumps({"kind": "python", "code": (OB / f).read_text(), "description": "ok"})
    for label, code, want in (("start", bad, False), ("answer", good, True)):
        feed(["cat"])
        result = json.loads(run(code, check))
        got = bool(result["ok"] and result["check"] and result["check"]["passed"])
        msg = (result["check"] or {}).get("message") or result.get("error")
        report(got == want, f"onboarding/{f} [{label}] passed={got}", msg)

for project, steps in CASES.items():
    folder = PROJECTS / project
    manifest = json.loads((folder / "project.json").read_text())
    checks = {}
    for m in manifest["milestones"]:
        for s in m["steps"]:
            c = s.get("check")
            if c:
                c = dict(c)
                if c["kind"] == "python":
                    c["code"] = (folder / c["file"]).read_text()
                checks[s["id"]] = c
    untested = [sid for sid, c in checks.items() if c["kind"] != "runs" and sid not in steps]
    for sid in untested:
        report(False, f"{project}/{sid}", "has a check but no test case")
    for step_id, case in steps.items():
        bad, good = case[0], case[1]
        answers = case[2] if len(case) > 2 else ()
        check = json.dumps(checks[step_id])
        for label, code, want in (("start", bad, False), ("answer", good, True)):
            if code is None:
                continue
            feed(answers() if callable(answers) else answers)
            result = json.loads(run(code, check))
            got = bool(result["ok"] and result["check"] and result["check"]["passed"])
            msg = (result["check"] or {}).get("message") or result.get("error")
            report(got == want, f"{project}/{step_id} [{label}] passed={got}", msg)
    # The reference solution (and any preview) must run without errors.
    for key in ("solution", "preview"):
        name = manifest["files"].get(key)
        if not name:
            continue
        answers = SOLUTION_FEEDS.get(project, ())
        feed(answers() if callable(answers) else answers)
        result = json.loads(run(fill((folder / name).read_text()), None))
        report(result["ok"], f"{project}/{key} runs", result.get("error") or "")

print(f"\n{failures} problem(s)")
sys.exit(1 if failures else 0)
