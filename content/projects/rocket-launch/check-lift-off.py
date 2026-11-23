rockets = [s for s in sprites() if s[1] == "rocket"]
if not rockets:
    fail("I can't see the rocket. Keep the stage.sprite(\"rocket\", ...) lines.")
top = min(s[3] for s in rockets)
if top > 290:
    fail("The rocket didn't move. Put a number in the blank, like  y = y - 20 , so y gets smaller each frame.")
if top > -40:
    fail("It's rising, but it doesn't leave the stage yet. Try a bigger number in the blank.")
