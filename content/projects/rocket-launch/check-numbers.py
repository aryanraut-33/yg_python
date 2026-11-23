shown = [t[3] for t in texts()]
missing = [str(n) for n in range(10, 0, -1) if str(n) not in shown]
if len(missing) == 10:
    fail("The stage shows no numbers yet. Put  n  in the blank: stage.text(320, 130, n, size=90)")
if missing:
    fail("Some numbers are missing from the stage. The blank should be  n , the loop's number.")
