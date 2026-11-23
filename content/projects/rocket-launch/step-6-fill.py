import stage

rocket_name = "Mission Dadi"

# The countdown
for n in range(10, 0, -1):
    stage.clear()
    stage.text(320, 40, rocket_name, size=24, color="butter")
    stage.sprite("rocket", 320, 300, 2)
    if n <= 5:
        stage.text(320, 140, n, size=90, color="coral")
    else:
        stage.text(320, 140, n, size=90, color="cream")
    stage.wait(0.5)

# Lift-off!
y = 300
for frame in range(25):
    stage.clear()
    stage.text(320, 40, "Lift-off!", size=40, color="butter", glow=True)
    stage.sprite("rocket", 320, y, 2)
    y = y - ___
    stage.wait(0.04)
