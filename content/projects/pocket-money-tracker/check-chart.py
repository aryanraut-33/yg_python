bars = [r for r in rects() if r[4] > 0]
totals = ns.get("totals")
if not isinstance(totals, list) or len(totals) < 2:
    fail("Keep the loop that builds the totals list.")
if len(bars) < len(totals):
    fail("No chart yet. Put the list of running totals in the blank: stage.bar_chart(totals, labels, ...)")
heights = [b[4] for b in bars[: len(totals)]]
if any(b < a - 0.5 for a, b in zip(heights, heights[1:])):
    fail("The bars should only grow, because savings add up. Use the totals list, not weekly.")
