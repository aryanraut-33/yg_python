import math
segs = [s for s in lines() if (s[3] - s[1]) ** 2 + (s[4] - s[2]) ** 2 > 0.5]
if len(segs) < 10:
    fail("Keep the spiral loop: it should draw lots of lines.")
heads = [math.degrees(math.atan2(s[4] - s[2], s[3] - s[1])) for s in segs]
turns = [round((b - a) % 360, 1) for a, b in zip(heads, heads[1:])]
if all(abs(t - 90) < 0.6 or abs(t - 270) < 0.6 for t in turns):
    fail("It's still a square spiral. Change the 90 in t.right(90) to a different angle, like 91 or 121.")
