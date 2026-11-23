import random
import stage

heroes = {{heroes_py|["a brave cat", "Dadi", "a tiny robot"]}}
places = {{places_py|["the moon", "a mango tree", "a busy Mumbai station"]}}
problems = {{problems_py|["lost their shoes", "met a grumpy elephant", "forgot the way home"]}}
twists = {{twists_py|["a dragon said sorry", "it was all a dream", "everyone got ice cream"]}}


def tell_story():
    hero = random.choice(heroes)
    place = random.choice(places)
    problem = random.choice(problems)
    twist = random.choice(twists)
    story = f"Once upon a time, {hero} went to {place}. But oh no, {hero} {problem}! Then, {twist}."
    stage.clear()
    stage.sprite("star", 120, 90, 1.5)
    stage.sprite("moon", 520, 90, 1.5)
    stage.text(320, 180, hero, size=44, color="butter", font="serif")
    stage.text(320, 240, "went to " + place, size=24)
    print(story)
    stage.___(story)


tell_story()
