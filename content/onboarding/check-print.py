lines = [l for l in output.splitlines() if l.strip()]
low = output.lower()
if len(lines) < 2:
    fail("Python only printed one line. Add a second print( ) line underneath.")
if "riff" not in low or "nix" not in low:
    fail("Say hello to both of us! One line for Riff and one line for Nix.")
