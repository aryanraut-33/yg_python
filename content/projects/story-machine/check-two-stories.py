if not callable(ns.get("tell_story")):
    fail("Keep the  def tell_story():  recipe.")
blocks = [b for b in output.strip().split("\n\n") if b.strip()]
if len(blocks) < 2:
    fail("Only one story came out. Replace the blank with  tell_story()  to call the recipe a second time.")
