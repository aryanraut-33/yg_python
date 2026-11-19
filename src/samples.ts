// Sample programs for the Phase 0 playground. Each one exercises part of the runtime.
import { loadProjects } from './content/projects';

export interface Sample {
  id: string;
  label: string;
  code: string;
}

const nameLightShow = loadProjects().find((p) => p.manifest.id === 'name-light-show');

export const SAMPLES: Sample[] = [
  {
    id: 'hello',
    label: 'Hello (print + stage)',
    code: `import stage

print("Hello from Python!")
stage.background("night")
stage.text(320, 200, "Hello!", size=72, color="butter", font="serif", glow=True)
`,
  },
  {
    id: 'blink',
    label: 'Blinking lights (wait)',
    code: `import stage

name = "MEERA"
gap = 100
start = (stage.WIDTH - (len(name) - 1) * gap) / 2

for flash in range(10):
    stage.background("night")
    x = start
    for letter in name:
        stage.circle(x, 200, 40, stage.random_color(), glow=True)
        stage.text(x, 200, letter, size=44, color="pine", font="serif")
        x = x + gap
    stage.wait(0.3)

print("Light show finished!")
`,
  },
  {
    id: 'input',
    label: 'Ask my name (input)',
    code: `import stage

name = input("What's your name? ")
print("Nice to meet you,", name)

stage.background("night")
stage.text(320, 200, name, size=80, color="mint", font="serif", glow=True)
`,
  },
  {
    id: 'endless',
    label: 'Endless loop (test Stop)',
    code: `# This never ends on its own. Press Stop!
count = 0
while True:
    count = count + 1
`,
  },
  {
    id: 'endless-drawing',
    label: 'Endless animation (test Stop)',
    code: `import stage

x = 0
while True:
    stage.background("night")
    stage.circle(x, 200, 30, "coral", glow=True)
    x = (x + 8) % stage.WIDTH
    stage.wait(0.03)
`,
  },
  {
    id: 'flood',
    label: 'Print flood (test Stop)',
    code: `n = 0
while True:
    print("Line", n)
    n = n + 1
`,
  },
  {
    id: 'error',
    label: 'Oops (error test)',
    code: `score = 10
print("Score is", scroe)
`,
  },
  {
    id: 'syntax',
    label: 'Oops (syntax error test)',
    code: `for i in range(3)
    print(i)
`,
  },
];

if (nameLightShow) {
  SAMPLES.unshift({
    id: 'name-light-show',
    label: 'Name Light Show · starter (from content/)',
    code: nameLightShow.files[nameLightShow.manifest.files.starter] ?? '',
  });
}
