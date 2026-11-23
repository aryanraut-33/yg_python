twists = ns.get("twists")
if not isinstance(twists, list) or len(twists) < 3:
    fail('Add a list called twists with at least 3 twists, like "it was all a dream".')
stories = set()
for seed in range(8):
    sim = simulate([], seed=seed)
    if sim.error:
        fail("Your story machine has a problem: " + sim.error)
    lines = [l for l in sim.output.splitlines() if l.strip()]
    if len(lines) < 3:
        fail("Your story needs 3 sentences: the start, the problem and the twist.")
    if not any(t in sim.output for t in twists):
        fail("Add  twist = random.choice(twists)  and a third sentence with {twist} in it.")
    stories.add(sim.output)
if len(stories) < 2:
    fail("Every story comes out the same. Use random.choice for each part.")
remember = {"twists_py": repr(twists)}
