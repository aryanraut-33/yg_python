nums = [line.strip() for line in output.splitlines() if line.strip()]
if nums[:10] != [str(n) for n in range(10, 0, -1)]:
    fail("The countdown should still print 10 down to 1. Keep the for loop and the print line.")
pauses = [w for w in waits() if w[1] >= 0.2]
if len(pauses) < 9:
    fail("The numbers all came out at once. Add  stage.wait(0.5)  inside the loop, with 4 spaces in front, under print(n).")
