s = rover_state()
if s is None or s["mission"] != 2:
    fail("Keep  rover.mission(2)  at the top.")
if not s["reached"]:
    fail('Not at the flag yet. After forward(4), add  rover.turn("left")  and drive forward the right number of squares.')
