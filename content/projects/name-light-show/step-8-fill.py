import stage

name = "{{name}}"

for flash in range(___):
    stage.background("night")
    x = 40
    for letter in name:
        color = stage.random_color()
        stage.circle(x, 200, 26, color, glow=True)
        stage.text(x, 200, letter, size=32, color="pine", font="serif")
        x = x + 60
    stage.wait(0.4)
