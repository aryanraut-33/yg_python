low = output.lower()
if "spoiler" in low:
    fail("The spoiler still printed! Put a # at the very start of that line.")
if "starts" not in low or "end" not in low:
    fail("Only hide the spoiler line. The other two lines should still print.")
if "#" not in code:
    fail("Use a # to turn the spoiler line into a comment.")
