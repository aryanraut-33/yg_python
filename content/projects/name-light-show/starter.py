import stage

name = "AARAV"

stage.background("night")

x = 120
for letter in name:
    stage.circle(x, 200, 40, "butter", glow=True)
    stage.text(x, 200, letter, size=44, color="pine", font="serif")
    x = x + 100
