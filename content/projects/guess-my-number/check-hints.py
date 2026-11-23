UP = ("higher", "bigger", "up", "more", "too low", "too small")
DOWN = ("lower", "smaller", "down", "less", "too high", "too big")
seed = None
for s in range(60):
    probe = simulate([], seed=s)
    secret = probe.ns.get("secret")
    if isinstance(secret, int) and 2 <= secret <= 99:
        seed = s
        break
if seed is None:
    fail("Keep the line  secret = random.randint(1, 100)  near the top.")
low = simulate([secret - 1], seed=seed)
high = simulate([secret + 1], seed=seed)
for sim in (low, high):
    if sim.error:
        fail("Your program has a problem: " + sim.error)
after_low = low.output.split(str(secret - 1), 1)[-1].lower()
after_high = high.output.split(str(secret + 1), 1)[-1].lower()
if not any(w in after_low for w in UP):
    fail('When the guess is too small, print a hint like "Higher!". Add  elif guess < secret:  and a print under it.')
if not any(w in after_high for w in DOWN):
    fail('When the guess is too big, print a hint like "Lower!". Use  else:  (or another elif) with a print under it.')
