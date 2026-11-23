problems = ns.get("problems")
if not isinstance(problems, list) or len(problems) < 3:
    fail('Add a list called problems with at least 3 problems, like "lost their shoes".')
if not all(isinstance(p, str) and p.strip() for p in problems):
    fail("Every problem needs quotes around it, with commas between them.")
for seed in range(6):
    sim = simulate([], seed=seed)
    if sim.error:
        fail("Your story machine has a problem: " + sim.error)
    if not any(p in sim.output for p in problems):
        fail("Your story doesn't use a problem yet. Add  problem = random.choice(problems)  and print a sentence with {problem} in it.")
remember = {"problems_py": repr(problems)}
