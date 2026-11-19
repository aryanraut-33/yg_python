import stage

name = "AARAV"
gap = 100
start = (stage.WIDTH - (len(name) - 1) * gap) / 2

for flash in range(6):
    stage.background("night")
    x = start
    for letter in name:
        color = stage.random_color()
        stage.circle(x, 200, 40, color, glow=True)
        stage.text(x, 200, letter, size=44, color="pine", font="serif")
        x = x + gap
    stage.wait(0.4)
