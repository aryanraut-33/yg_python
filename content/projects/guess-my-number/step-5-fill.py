import random

secret = random.randint(1, 100)
print("I picked a number from 1 to 100.")
guess = 0
while guess ___ secret:
    guess = int(input("Your guess: "))
    if guess < secret:
        print("Higher!")
    elif guess > secret:
        print("Lower!")
print("You got it! It was", secret)
