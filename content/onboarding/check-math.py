slices = ns.get("slices")
if slices is None:
    fail("Make a box called slices that works out the answer, like:  slices = 3 * 8")
if "*" not in code:
    fail("Use * (times) to work it out, so Python does the maths for you.")
if slices != 24:
    fail(f"slices is {slices}. Three pizzas with 8 slices each should be 24. Check your numbers.")
if "24" not in output:
    fail("Python worked out 24. Now print(slices) so we can see it!")
