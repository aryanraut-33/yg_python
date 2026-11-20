w = waits()
cs = circles()
backgrounds = [d for d in drawn if d[0] == "bg"]
changed = (
    any(abs(x[1] - 0.4) > 0.001 for x in w)
    or any(abs(c[3] - 26) > 0.01 for c in cs)
    or any(b[1].upper() != "#0B1714" for b in backgrounds)
    or len(w) != 8
)
if not w:
    fail("I can't see any flashes. Keep the stage.wait line inside the big loop.")
if not changed:
    fail("It looks just like before! Change the wait time, the size of the lights, the number of flashes or the background colour.")
