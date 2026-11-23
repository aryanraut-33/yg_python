name = ns.get("rocket_name")
if not isinstance(name, str) or not name.strip():
    fail('Keep the line  rocket_name = "..."  with a name inside the quotes.')
if name.strip() == "Mission Dadi":
    fail("Give your rocket its own name! Change Mission Dadi to anything you like.")
if not any(t[3] == name for t in texts()):
    fail("Your rocket's name isn't on the stage. Keep the stage.text line that uses rocket_name.")
