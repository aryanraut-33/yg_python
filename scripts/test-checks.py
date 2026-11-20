"""Runs each project's behaviour checks in local CPython.

For every step with a check, the step's starting code should FAIL (where listed)
and the sample answer should PASS. Run with:  npm run test:checks
"""
import json
import pathlib
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

# step id -> (code that should fail or None, code that should pass)
NLS = ROOT / "content" / "projects" / "name-light-show"
step = lambda f, name="AARAV": (NLS / f).read_text().replace("{{name}}", name)

CASES = {
    "name-light-show": {
        "move-light": (step("step-1-predict.py"), step("step-1-predict.py").replace("320", "100")),
        "light-colour": (
            step("step-1-predict.py").replace("320", "100"),
            step("step-1-predict.py").replace('"butter"', '"mint"'),
        ),
        "your-name": (step("step-4-predict.py"), step("step-4-predict.py").replace("AARAV", "Meera")),
        "spread-lights": (
            step("step-7-build.py", "MEERA"),
            step("step-7-build.py", "MEERA") + "    x = x + 60\n",
        ),
        "flashing": (
            step("step-8-fill.py", "MEERA").replace("___", "2"),
            step("step-8-fill.py", "MEERA").replace("___", "8"),
        ),
        "make-it-yours": (
            step("step-8-fill.py", "MEERA").replace("___", "8"),
            step("step-8-fill.py", "MEERA").replace("___", "8").replace("0.4", "0.15"),
        ),
    }
}

# Onboarding (Speak Python) challenges: (starter that should fail, answer that should pass)
import builtins
builtins.input = lambda prompt="": (print(prompt, end=""), "cat")[1]
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
for f, (bad, good) in ONBOARDING.items():
    check = json.dumps({"kind": "python", "code": (OB / f).read_text(), "description": "ok"})
    for label, code, want in (("start", bad, False), ("answer", good, True)):
        result = json.loads(run(code, check))
        got = bool(result["ok"] and result["check"] and result["check"]["passed"])
        msg = (result["check"] or {}).get("message") or result.get("error")
        if got != want:
            failures += 1
        print(f"{'ok ' if got == want else 'BAD'} onboarding/{f} [{label}] passed={got}  {msg}")

for project, steps in CASES.items():
    manifest = json.loads((ROOT / "content" / "projects" / project / "project.json").read_text())
    checks = {}
    for m in manifest["milestones"]:
        for s in m["steps"]:
            c = s.get("check")
            if c:
                c = dict(c)
                if c["kind"] == "python":
                    c["code"] = (ROOT / "content" / "projects" / project / c["file"]).read_text()
                checks[s["id"]] = c
    for step_id, (bad, good) in steps.items():
        check = json.dumps(checks[step_id])
        for label, code, want in (("start", bad, False), ("answer", good, True)):
            if code is None:
                continue
            result = json.loads(run(code, check))
            got = bool(result["ok"] and result["check"] and result["check"]["passed"])
            msg = (result["check"] or {}).get("message") or result.get("error")
            status = "ok " if got == want else "BAD"
            if got != want:
                failures += 1
            print(f"{status} {project}/{step_id} [{label}] passed={got}  {msg}")
    # The reference solution must run without errors.
    sol = json.loads(run((ROOT / "content" / "projects" / project / manifest["files"]["solution"]).read_text(), None))
    print(("ok " if sol["ok"] else "BAD") + f" {project}/solution runs")
    failures += 0 if sol["ok"] else 1

print(f"\n{failures} problem(s)")
sys.exit(1 if failures else 0)
