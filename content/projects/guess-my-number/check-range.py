import re
secrets = []
for seed in range(40):
    sim = simulate([], seed=seed)
    if sim.error:
        fail("Your program has a problem: " + sim.error)
    s = sim.ns.get("secret")
    if not isinstance(s, int):
        fail("Keep the line  secret = random.randint(...)  so the computer picks a number.")
    secrets.append(s)
    shown = [int(n) for n in re.findall(r"\d+", sim.output)]
    if s not in (1, 100) and s in shown:
        fail("The secret is still being given away! Delete the line that prints it (the Psst line).")
if max(secrets) <= 10:
    fail("The secret is still only 1 to 10. Change random.randint(1, 10) to random.randint(1, 100).")
if min(secrets) < 1 or max(secrets) > 100:
    fail("The secret should be from 1 to 100.")
