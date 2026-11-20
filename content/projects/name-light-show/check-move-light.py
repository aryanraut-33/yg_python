cs = circles()
if not cs:
    fail("I can't see a light. Make sure the stage.circle line is still there.")
x = cs[-1][1]
if x >= 200:
    fail(f"The light is at x = {x:g}, so it's still in the middle or on the right. Make x smaller (try 100) to move it left.")
