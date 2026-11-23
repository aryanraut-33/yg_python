CORAL = "#FF8A65"
colour = {t[3]: t[5] for t in texts() if t[3] in [str(n) for n in range(1, 11)]}
if len(colour) < 10:
    fail("Keep all ten numbers on the stage: 10 down to 1.")
coral = sorted(int(n) for n, c in colour.items() if c.upper() == CORAL)
if coral == [1, 2, 3]:
    fail("Still only 3, 2 and 1 are coral. Change the 3 in  if n <= 3:  so five numbers turn coral.")
if coral != [1, 2, 3, 4, 5]:
    fail(f"Right now these turn coral: {coral}. Make it exactly 5, 4, 3, 2 and 1.")
