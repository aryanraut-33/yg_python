s = rover_state()
if s is None or s["mission"] != 5:
    fail("Keep  rover.mission(5)  at the top.")
if not s["has_probe"]:
    fail("The probe is still out there. Drive to it first: it's 7 squares right and 3 squares up.")
if not s["reached"]:
    fail("You have the probe! Now drive back to the base where you started.")
