name = ns.get("name")
if not isinstance(name, str):
    fail('I can\'t find the name box. Keep the line that starts with  name = "...')
if name.strip() == "":
    fail("The name box is empty. Type your name between the quotes.")
if name.strip().upper() == "AARAV":
    fail("It still says AARAV. Swap it for your own name, keeping the quotes.")
if not any(t[3] == name for t in texts()):
    fail("Your name isn't on the stage yet. Keep the stage.text line that uses name.")
remember = {"name": name.strip()}
