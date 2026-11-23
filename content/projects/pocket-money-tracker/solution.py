import stage

goal_item = "cricket bat"
goal = 800

# What I saved each week
weekly = [100, 50, 200, 50, 80, 120]
labels = ["W1", "W2", "W3", "W4", "W5", "W6"]

# Add it up week by week
totals = []
running = 0
for amount in weekly:
    running = running + amount
    totals.append(running)

stage.bar_chart(totals, labels, goal=goal, title="Saving for my " + goal_item)

# When will I reach my goal?
per_week = round(sum(weekly) / len(weekly))
week = len(weekly)
total = totals[-1]
while total < goal:
    week = week + 1
    total = total + per_week

print("I save about", per_week, "a week.")
print("I can buy my", goal_item, "in week", week)
stage.text(60, 90, "Week " + str(week) + "!", size=26, color="coral", align="left")
