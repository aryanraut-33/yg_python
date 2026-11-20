w = waits()
if len(w) < 3:
    fail(f"Your lights flashed {len(w)} time(s). Put a number of 3 or more inside range( ).")
colors = {c[4] for c in circles()}
if len(colors) < 2:
    fail("The colours aren't changing. Keep  color = stage.random_color()  inside the loop.")
