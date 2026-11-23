import re
first = simulate([], seed=11)
secret = first.ns.get("secret")
if not isinstance(secret, int):
    fail("Keep the line  secret = random.randint(1, 100) .")
wrongs = [n for n in (1, 100, 50, 25, 75, 60) if n != secret]
three = simulate(wrongs[:2] + [secret], seed=11)
five = simulate(wrongs[:4] + [secret], seed=11)
for sim in (three, five):
    if sim.error:
        fail("Your program has a problem: " + sim.error)
    if not sim.finished:
        fail("Keep the while loop working: the game should end when the guess is right.")
tail3 = " ".join(three.output.strip().splitlines()[-2:])
tail5 = " ".join(five.output.strip().splitlines()[-2:])
nums3 = [int(n) for n in re.findall(r"\d+", tail3)]
nums5 = [int(n) for n in re.findall(r"\d+", tail5)]
if 3 not in nums3 or 5 not in nums5:
    fail("Count the tries: tries = 0 before the loop, tries = tries + 1 inside it, and print tries at the end.")
