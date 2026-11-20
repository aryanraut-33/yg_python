lines = [l.strip() for l in output.splitlines()]
if "4" not in lines:
    fail("Make one line print 4. Add two numbers WITHOUT quotes: print(2 + 2)")
if "22" not in lines:
    fail("Now make a line print 22, by adding two pieces of TEXT: print(\"2\" + \"2\")")
