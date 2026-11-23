import re
weekly, totals, goal, per_week = ns.get("weekly"), ns.get("totals"), ns.get("goal"), ns.get("per_week")
if not (isinstance(weekly, list) and isinstance(totals, list) and totals and isinstance(per_week, (int, float))):
    fail("Keep the lists and the per_week line from the starting code.")
week, total = len(weekly), totals[-1]
while total < goal and per_week > 0:
    week += 1
    total += per_week
last = output.strip().splitlines()[-1] if output.strip() else ""
nums = [int(n) for n in re.findall(r"\d+", last)]
if week not in nums:
    fail("The finish week isn't right yet. The loop should keep adding weeks while the total is LESS than the goal: while total < goal:")
