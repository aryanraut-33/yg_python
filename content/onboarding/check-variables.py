pet = ns.get("pet")
if pet is None:
    fail("Make a box called pet, like:  pet = \"Bruno\"")
if not isinstance(pet, str) or not pet.strip():
    fail("Put your dream pet's name in the box, inside quotes.")
if pet not in output:
    fail("The box is ready. Now open it with print(pet).")
