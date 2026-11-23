DEFAULT_HEROES = ["a brave cat", "Dadi", "a tiny robot"]
DEFAULT_PLACES = ["the moon", "a mango tree", "a busy Mumbai station"]
heroes, places = ns.get("heroes"), ns.get("places")
for name, value in (("heroes", heroes), ("places", places)):
    if not isinstance(value, list):
        fail(f"Keep the list called {name}, with square brackets [ ].")
    if len(value) < 3 or not all(isinstance(v, str) and v.strip() for v in value):
        fail(f"Your {name} list needs at least 3 words, each in quotes, with commas between them.")
if heroes == DEFAULT_HEROES:
    fail("The heroes are still ours. Swap in your own, like \"my little sister\" or \"a sleepy lion\".")
if places == DEFAULT_PLACES:
    fail("The places are still ours. Swap in your own, like \"Goa beach\" or \"a secret cave\".")
remember = {"heroes_py": repr(heroes), "places_py": repr(places)}
