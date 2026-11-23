import random

secret = random.randint(1, 100)
print("I picked a number from 1 to 100.")
guess = int(input("Your guess: "))
if guess == secret:
    print("You got it!")
else:
    print("Nope!")
