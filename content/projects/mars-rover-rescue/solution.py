import rover

rover.mission(5)


def drive(squares, then=None):
    rover.forward(squares)
    if then:
        rover.turn(then)


# Out to the probe, along the bottom row
rover.turn("right")
drive(1, "left")
drive(7, "left")
drive(4)
# Home along the top row
drive(1, "left")
drive(7, "left")
drive(4)
print("Battery left:", rover.battery(), "%")
