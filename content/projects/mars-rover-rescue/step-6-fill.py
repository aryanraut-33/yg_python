import rover

rover.mission(4)


def go_around():
    rover.turn("left")
    rover.forward(1)
    rover.turn("right")
    rover.forward(2)
    rover.turn("right")
    rover.forward(1)
    rover.turn("left")


rover.forward(1)
go_around()
rover.forward(1)
___
rover.forward(1)
go_around()
rover.forward(1)
