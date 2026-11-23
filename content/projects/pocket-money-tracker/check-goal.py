item, goal = ns.get("goal_item"), ns.get("goal")
if not isinstance(item, str) or not item.strip():
    fail('Keep  goal_item = "..."  with the thing you want inside the quotes.')
if item.strip() == "cricket bat":
    fail("Pick your own goal! Change \"cricket bat\" to something you'd love to buy.")
if isinstance(goal, bool) or not isinstance(goal, (int, float)):
    fail("The goal should be a number with no quotes, like  goal = 1500 .")
if goal <= ns.get("saved", 0):
    fail("Make the goal bigger than what you've already saved, so there's something to save for.")
remember = {"item": item.strip(), "goal": str(int(goal))}
