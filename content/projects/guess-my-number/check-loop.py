first = simulate([], seed=7)
secret = first.ns.get("secret")
if not isinstance(secret, int):
    fail("Keep the line  secret = random.randint(1, 100) .")
wrong1 = 1 if secret != 1 else 2
wrong2 = 100 if secret != 100 else 99
sim = simulate([wrong1, wrong2, secret], seed=7)
if sim.runaway:
    fail("The loop never stops! The blank should make it keep going only while the guess is NOT the secret: !=")
if sim.error:
    fail("Your program has a problem: " + sim.error)
if sim.ran_out or sim.answers_used < 3:
    fail("The game should keep asking until the guess is right. Check the blank: while guess != secret:")
if "got it" not in sim.output.lower():
    fail('Keep the "You got it!" line at the end, outside the loop.')
