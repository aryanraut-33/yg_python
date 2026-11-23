import random

secret = random.randint(1, 100)
print("I picked a number from 1 to 100.")
guess = 0
tries = 0
while guess != secret:
    guess = int(input("Your guess: "))
    tries = tries + 1
    if guess < secret:
        print("Higher!")
    elif guess > secret:
        print("Lower!")
print("You got it in", tries, "tries! It was", secret)
