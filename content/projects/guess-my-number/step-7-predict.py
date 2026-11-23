low = 1
high = 100
tries = 0
answer = ""
print("Think of a number from 1 to 100. I'll guess it!")
while answer != "yes":
    guess = (low + high) // 2
    tries = tries + 1
    print("Is it", guess, "?")
    answer = input("Type higher, lower or yes: ")
    if answer == "higher":
        low = guess + 1
    elif answer == "lower":
        high = guess - 1
print("I got it in", tries, "tries!")
