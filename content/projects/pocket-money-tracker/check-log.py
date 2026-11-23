money_in, money_out = ns.get("money_in"), ns.get("money_out")
if not isinstance(money_in, list) or not isinstance(money_out, list):
    fail("Keep the two lists, money_in and money_out.")
if not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in money_in + money_out):
    fail("Money goes in the lists as plain numbers, with no quotes. Like [100, 50, 20].")
if len(money_in) < 6:
    fail(f"money_in has {len(money_in)} amounts. Add 2 more on the end, with commas, like 100, 75.")
if len(money_out) < 3:
    fail("Add one more thing you spent to money_out, like 40 for a comic.")
if ns.get("saved") != sum(money_in) - sum(money_out):
    fail("Keep the line  saved = sum(money_in) - sum(money_out) .")
