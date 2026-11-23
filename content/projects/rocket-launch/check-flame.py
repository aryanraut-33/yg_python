rockets = [s for s in sprites() if s[1] == "rocket"]
flames = [s for s in sprites() if s[1] in ("flame", "smoke")]
if len(flames) < 10:
    fail('No fire yet. Inside the lift-off loop, add  stage.sprite("flame", 320, y + 60, 2)  above the rocket line.')
moving = [r for r in rockets if r[3] < 300]
if moving and min(f[3] for f in flames) < min(r[3] for r in moving) - 5:
    fail("The flame is above the rocket! Use  y + 60  so it sits underneath.")
