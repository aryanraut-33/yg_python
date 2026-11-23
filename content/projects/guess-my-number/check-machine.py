sim = simulate(["yes"])
if sim.error:
    fail("Your guessing machine has a problem: " + sim.error)
if sim.ran_out:
    fail('When you type yes, the machine should stop and say how many tries it took. Keep  while answer != "yes":')
if sim.runaway:
    fail("The machine got stuck in a loop. Check the while line.")
if "1" not in sim.output:
    fail("At the end, print how many tries it took.")
