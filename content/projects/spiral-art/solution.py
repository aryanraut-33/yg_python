import turtle
import random

turtle.bgcolor("night")
t = turtle.Turtle()
t.speed(10)
t.width(2)

colours = ["mint", "coral", "sky", "butter", "blossom", "lilac"]
size = 4
for i in range(110):
    t.color(random.choice(colours))
    t.forward(size)
    t.right(121)
    size = size + 3
t.hideturtle()
