import stage

for n in range(10, 0, -1):
    stage.clear()
    stage.sprite("rocket", 320, 300, 2)
    if n <= 3:
        stage.text(320, 130, n, size=90, color="coral")
    else:
        stage.text(320, 130, n, size=90, color="cream")
    stage.wait(0.5)
