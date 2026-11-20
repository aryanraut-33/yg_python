name = ns.get("name", "")
cs = circles()
xs = sorted({round(c[1]) for c in cs})
if len(cs) < len(name):
    fail("Some letters are missing their light. Keep the stage.circle line inside the loop.")
if len(xs) < 2:
    fail("The lights are still stacked in one spot. Add  x = x + 60  inside the loop, lined up under stage.text.")
if len(xs) < len(name):
    fail("Almost! Some lights still overlap. Check that  x = x + 60  has 4 spaces in front, so it's inside the loop.")
if xs[-1] > 630:
    fail("What a long name! Some lights went off the right edge. Try a smaller step, like  x = x + 45.")
