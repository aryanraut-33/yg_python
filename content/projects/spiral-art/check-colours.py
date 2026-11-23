colours_used = {s[5] for s in lines()}
if len(colours_used) < 3:
    fail("The spiral is still one colour. Put the list's name, colours, in the blank: random.choice(colours)")
