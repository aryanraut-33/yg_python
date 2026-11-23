import math
DEFAULT = ["mint", "coral", "sky", "butter", "blossom", "lilac"]
cols = ns.get("colours")
if not isinstance(cols, list) or len(cols) < 2:
    fail("Keep a list called colours with at least 2 colours in it.")
segs = [s for s in lines() if (s[3] - s[1]) ** 2 + (s[4] - s[2]) ** 2 > 0.5]
heads = [math.degrees(math.atan2(s[4] - s[2], s[3] - s[1])) for s in segs]
turns = {round((b - a) % 360) for a, b in zip(heads, heads[1:])}
changed_colours = sorted(map(str, cols)) != sorted(DEFAULT)
changed_angle = turns and not turns <= {269, 91}
changed_count = len(segs) != 80
if not (changed_colours or changed_angle or changed_count):
    fail("Make it yours: change the colours in the list, the angle in t.right(91), or the number in range(80).")
