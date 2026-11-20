if "input(" not in code:
    fail("Use input(\"...\") to ask a question.")
answers = [v for k, v in ns.items() if not k.startswith("_") and isinstance(v, str) and v.strip()]
if not answers:
    fail("Store the answer in a box, like:  animal = input(\"Favourite animal? \")")
if not any(a in output for a in answers):
    fail("Print a sentence that uses the answer, like:  print(\"I love\", animal)")
