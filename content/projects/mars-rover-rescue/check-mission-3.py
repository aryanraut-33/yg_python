s = rover_state()
if s is None or s["mission"] != 3:
    fail("Keep  rover.mission(3)  at the top.")
if not s["reached"]:
    fail("Not at the flag yet. Go around the crater: turn left, forward 1, turn right, forward 2, turn right, forward 1, turn left, then on to the flag.")
