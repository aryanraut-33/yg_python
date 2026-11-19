# yg python

A build-first Python learning platform for kids aged 10–14. Python runs **in the child's browser** (Pyodide in a Web Worker); there are no servers that run code.

Start with [docs/HANDOFF.md](docs/HANDOFF.md) for every product and design decision.

**Status:** Phase 0 (Foundations) is built. The app is currently a developer playground for checking the runtime.

## Run it

Requires Node 22+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # validates every project in content/
npm run build      # type-check and build into dist/
npm run preview    # serve the production build at http://localhost:4173
```

`npm run dev` and `npm run build` first copy the Pyodide runtime (about 12 MB) from `node_modules` into `public/pyodide/<version>/`, so Python is served from our own domain.

## Deploy (Cloudflare Pages, free)

This uses direct upload, so no git commits are needed. It's a one-time setup:

```bash
npx wrangler login     # opens the browser; sign up for or log in to a free Cloudflare account
npm run deploy         # builds and uploads; the first run creates the "yg-python" Pages project
```

The command prints a `https://yg-python.pages.dev` link (or a preview link). Run `npm run deploy` again to ship each update.

Later, once the code is on GitHub, you can switch to Git integration in the Cloudflare dashboard (Workers & Pages → yg-python → Settings → Builds). Use the build command `npm run build` and the output folder `dist`.

`public/_headers` sets the headers the runtime depends on:
- **COOP/COEP:** cross-origin isolation, which enables shared memory. Stop and `input()` need it.
- **Long cache lifetimes** for `/pyodide/*` and `/assets/*`, so a returning visitor's browser keeps Python cached.
- **A Permissions-Policy** that blocks the camera, microphone and location for now.

## How it's built

```
src/
├── runtime/
│   ├── py.worker.ts        # runs Python in a Web Worker (Pyodide)
│   ├── PythonRunner.ts     # page side: run, Stop (interrupt, then restart), input()
│   ├── protocol.ts         # messages and shared-memory layout between page and worker
│   └── python/
│       ├── bootstrap.py    # fresh namespace per run; errors trimmed to the child's code
│       └── stage.py        # the `stage` drawing library (v0)
├── stage/StageRenderer.ts  # draws stage commands on a canvas
├── editor/                 # CodeMirror 6 editor + Night Workshop theme
├── content/                # project file format: types, validator, loader
├── ui/                     # tokens.css (design tokens), layout, console, icons
└── samples.ts              # playground sample programs
content/projects/<id>/      # projects as files (see content/README.md)
```

### How Stop works
1. Pressing Stop sends Python a `KeyboardInterrupt`. This works even inside `stage.wait()`, `time.sleep()` and `input()`.
2. If the program catches the interrupt and keeps going, the worker is restarted after 0.4 s. Python then reloads from the browser cache.

### The `stage` library (v0)
The stage is 640×400, with (0, 0) at the top-left corner.

| Function | What it does |
|---|---|
| `stage.background(color)` | Fill the stage, wiping it |
| `stage.clear()` | Wipe back to the background colour |
| `stage.circle(x, y, radius, color, glow=False)` | Filled circle |
| `stage.rect(x, y, width, height, color, round=0)` | Filled rectangle |
| `stage.line(x1, y1, x2, y2, color, thickness=2)` | Straight line |
| `stage.text(x, y, words, size=32, color, align="center", font="sans", glow=False)` | Text (`font`: sans, serif or mono) |
| `stage.wait(seconds)` | Show the frame and pause (`time.sleep` does the same) |
| `stage.random_color()` | A random bright colour name |
| `stage.WIDTH`, `stage.HEIGHT`, `stage.COLORS` | Constants |

Colour names are `butter`, `coral`, `mint`, `blossom`, `sky`, `lilac`, `cream`, `night`, `pine`, plus everyday names (`red`, `blue`, …), `#hex` values and `(r, g, b)` tuples.

## Privacy

There are no third-party requests: fonts are self-hosted (`@fontsource`), Pyodide is served from our own domain, and there's no analytics. Check this in DevTools → Network.
