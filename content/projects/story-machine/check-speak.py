said = spoken()
if not said:
    fail("The machine is silent. The blank is the stage command that reads words out loud: speak")
printed = [l.strip() for l in output.splitlines() if l.strip()]
if said[-1].strip() not in printed:
    fail("Make it speak the same story it prints: stage.speak(story)")
