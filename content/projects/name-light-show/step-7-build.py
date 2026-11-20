import stage

name = "{{name}}"

stage.background("night")

x = 40
for letter in name:
    stage.circle(x, 200, 26, "butter", glow=True)
    stage.text(x, 200, letter, size=32, color="pine", font="serif")
