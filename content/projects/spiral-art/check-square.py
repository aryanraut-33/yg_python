segs = lines()
if len(segs) < 4:
    fail(f"I count {len(segs)} sides so far. A square needs 4: keep going with forward(100) and right(90).")
end = (segs[-1][3], segs[-1][4])
start = (segs[0][1], segs[0][2])
if abs(end[0] - start[0]) > 2 or abs(end[1] - start[1]) > 2:
    fail("The lines don't join up into a closed square yet. Every side needs forward(100), then right(90).")
