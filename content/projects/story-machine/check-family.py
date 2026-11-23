heroes = ns.get("heroes")
if not isinstance(heroes, list) or len(heroes) < 4:
    fail('Add one more hero to your heroes list: someone from your family, like "Chintu bhaiya". Remember the comma!')
if not spoken():
    fail("Keep the stage.speak(story) line so the machine reads it out.")
