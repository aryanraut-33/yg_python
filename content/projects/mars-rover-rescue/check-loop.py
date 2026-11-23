s = rover_state()
if s is None or s["mission"] != 4:
    fail("Keep  rover.mission(4)  at the top.")
if not s["reached"]:
    fail("The rover didn't reach the flag. Inside the loop: go_around() and then rover.forward(1).")
calls = [l for l in code.splitlines() if l.strip() == "go_around()"]
if "for " not in code:
    fail("Use a loop:  for crater in range(3):  with go_around() and rover.forward(1) pushed in underneath.")
if len(calls) > 1:
    fail("Nearly! Now delete the extra go_around() lines, so it's only written once, inside the loop.")
