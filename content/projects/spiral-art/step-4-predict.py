import turtle

t = turtle.Turtle()
t.speed(10)
size = 5
for i in range(40):
    t.forward(size)
    t.right(90)
    size = size + 5
