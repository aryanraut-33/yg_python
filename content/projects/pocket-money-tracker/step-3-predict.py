goal_item = "{{item|cricket bat}}"
goal = {{goal|800}}

money_in = [100, 50, 200, 50]
money_out = [30, 20]

saved = sum(money_in) - sum(money_out)
print("Saving for:", goal_item)
print("Saved so far:", saved)
print("Weeks of saving:", len(money_in))
