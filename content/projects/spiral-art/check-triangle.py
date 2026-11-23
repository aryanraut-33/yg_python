segs = lines()
if len(segs) < 3:
    fail("Keep the loop that draws 3 sides.")
end = (segs[-1][3], segs[-1][4])
start = (segs[0][1], segs[0][2])
if abs(end[0] - start[0]) > 2 or abs(end[1] - start[1]) > 2:
    fail("The triangle doesn't close yet. A triangle's 3 turns must add up to a full spin of 360 degrees. What's 360 ÷ 3?")
