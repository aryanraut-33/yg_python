DEFAULT = [100, 50, 200, 50, 80, 120]
weekly, labels = ns.get("weekly"), ns.get("labels")
if not isinstance(weekly, list) or len(weekly) < 2:
    fail("Keep a weekly list with your savings.")
if weekly == DEFAULT:
    fail("Make the plan yours: change the numbers in the weekly list to what you could really save.")
if isinstance(labels, list) and len(labels) != len(weekly):
    fail(f"weekly has {len(weekly)} numbers but labels has {len(labels)}. Give every week a label, like \"W7\".")
if "week" not in output.lower():
    fail("Keep the print lines that show the finish week.")
