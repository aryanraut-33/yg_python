cs = circles()
if not cs:
    fail("I can't see a light. Make sure the stage.circle line is still there.")
if cs[-1][4].upper() == "#FFD66B":
    fail('The light is still butter yellow. Change the word "butter" to another colour, like "mint" or "coral".')
