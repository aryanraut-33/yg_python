# A pretend game, played by itself, for the intro screen.
import stage

secret = 65
guesses = [50, 75, 62, 68, 65]
stage.background("night")
print("I picked a number from 1 to 100.")
stage.text(320, 60, "Guess My Number", size=34, color="butter", font="serif")
stage.wait(0.8)
for i, guess in enumerate(guesses):
    print("Your guess:", guess)
    x = 100 + i * 110
    if guess < secret:
        hint, colour = "Higher!", "sky"
    elif guess > secret:
        hint, colour = "Lower!", "coral"
    else:
        hint, colour = "Got it!", "mint"
    stage.circle(x, 200, 42, colour, glow=True)
    stage.text(x, 200, guess, size=30, color="night")
    stage.text(x, 275, hint, size=18, color=colour)
    print(hint)
    stage.wait(0.9)
stage.text(320, 345, "5 tries!", size=28, color="cream")
print("You got it in 5 tries!")
