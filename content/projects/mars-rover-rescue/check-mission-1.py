s = rover_state()
if s is None or s["mission"] != 1:
    fail("Keep  import rover  and  rover.mission(1)  at the top.")
if not s["reached"]:
    fail("Not at the flag yet. Count the squares from the rover to the flag, and use that number in rover.forward(...).")
