if "+" not in code:
    fail("Use a + between two pieces of text to glue them together.")
if code.count('"') + code.count("'") < 4:
    fail("Each piece of text needs its own quotes, like \"Captain\" + \"Comet\".")
if not output.strip():
    fail("Nothing was printed yet. Put your glued text inside print( ).")
