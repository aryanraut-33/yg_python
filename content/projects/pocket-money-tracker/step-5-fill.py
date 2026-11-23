import stage

goal_item = "{{item|cricket bat}}"
goal = {{goal|800}}

# What I saved each week
weekly = [100, 50, 200, 50, 80, 120]
labels = ["W1", "W2", "W3", "W4", "W5", "W6"]

# Add it up week by week
totals = []
running = 0
for amount in weekly:
    running = running + amount
    totals.append(running)

print("Totals:", totals)
stage.bar_chart(___, labels, goal=goal, title="Saving for my " + goal_item)
