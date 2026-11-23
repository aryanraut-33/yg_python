s = rover_state()
if s is None or s["mission"] != 4:
    fail("Keep  rover.mission(4)  at the top.")
if not s["reached"]:
    fail("Not at the flag yet. Every crater needs  go_around() , and the blank is one of them.")
