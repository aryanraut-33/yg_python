s = rover_state()
if s is None or s["mission"] != 5 or not s["reached"]:
    fail("First make sure the rescue still works: probe picked up, rover back at base.")
if s["battery"] < 22:
    fail(f"Rescued with {s['battery']}% left. Can you beat 22%? Fewer turns save battery: try the bottom row out and the top row home.")
