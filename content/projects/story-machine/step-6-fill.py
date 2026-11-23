import random

heroes = {{heroes_py|["a brave cat", "Dadi", "a tiny robot"]}}
places = {{places_py|["the moon", "a mango tree", "a busy Mumbai station"]}}
problems = {{problems_py|["lost their shoes", "met a grumpy elephant", "forgot the way home"]}}
twists = {{twists_py|["a dragon said sorry", "it was all a dream", "everyone got ice cream"]}}


def tell_story():
    hero = random.choice(heroes)
    place = random.choice(places)
    problem = random.choice(problems)
    twist = random.choice(twists)
    print(f"Once upon a time, {hero} went to {place}.")
    print(f"But oh no, {hero} {problem}!")
    print(f"Then, {twist}.")
    print()


tell_story()
___
