# yg python: Handoff for the Next Agent

**Last updated:** 2026-11-20
**Status:** strategy, build plan, visual direction and landing hero are decided. **No application code has been written yet.** The next step is **Phase 0 (Foundations)**, which starts only once the user says go.

This document records every decision made so far and explains why. Read it fully before you change anything. When this doc conflicts with an older source, this doc wins. Within this doc, later decisions override earlier ones; where that has happened, it is marked.

---

## 0. Ground rules for whoever picks this up

1. **Work one decision at a time with the user.** They prefer a slow product discussion, one decision per step. Recommend an option instead of listing every possibility, then let them choose.
2. **Don't start coding until the user says so.** Phase 0 is next, but the user triggers it.
3. **Spend nothing.** Use free tiers only. Before you add any service, check that its free tier **allows commercial use**. Several don't: Vercel Hobby, Open-Meteo's free API, Figma's student plan (possibly).
4. **Protect children's privacy** (India's DPDP Act treats everyone under 18 as a child):
   - no third-party analytics or tracking SDKs;
   - verifiable parental consent;
   - collect as little data as possible.
5. **Never put the user's personal details in requests to outside services.**
6. **Follow [DESIGN_RULES.md](../DESIGN_RULES.md)** (the user's own design-engineering rules). In short:
   - establish the visual direction before writing code;
   - no generic "AI look": no gradients or glassmorphism, no purple/blue default palette, no emoji used as icons, no random decoration, not too many rounded cards;
   - build from tokens and reusable components;
   - **check every screen in a real browser at desktop and mobile widths before calling it done.**
7. **Laptop first, but phones are always supported.** Shared pages work on phones from Phase 3. Creating on a phone comes in Phase 5.

---

## 1. The product in one paragraph

yg python is a build-first Python learning platform for **kids aged 10–14 in India, taught in English**. Parents pay; children use it. The core promise:

- A child gets real Python running in their browser within the first three minutes.
- Every session ends with something that runs.
- Every project is something they're proud to show their family.

Python runs **in the child's browser** (Pyodide, which is real CPython compiled to WebAssembly). No server ever runs a child's code, which is what keeps costs at zero.

**Product principles** (use these to settle disagreements):
1. Build before explaining.
2. Every session ends with something that runs.
3. Struggling is fine; staying stuck is not.
4. Every project can be shown off in 30 seconds.
5. The help is meant to come away: guidance shrinks from project to project.

---

## 2. Decision log (all decided on 2026-11-19)

| # | Decision | Choice | What it means in practice |
|---|---|---|---|
| 1 | Who pays | **Parents at home (direct to consumer), freemium** | The parent loop is a core feature. Each shipped project reaches the parent as a playable link with a note on what was learned. No teacher dashboard until v2. |
| 2 | Launch ages | **10 to 14** | One UI style ("Makers"), plus a "grown-up" toggle that removes playful extras. Collect a waitlist for ages 7–9. |
| 3 | Market | **India, in English** | DPDP applies, so parental consent is needed for **every** user. UPI payments. Pay attention to bandwidth: cache Pyodide aggressively. Local themes (cricket, rupees, festivals). Map projects to CBSE coding topics. Transparent pricing and an easy cancel button, as a deliberate contrast with pushy edtech sales. |
| 4 | Human layer | **Self-paced core, plus a weekly "Build Club" A/B test in the beta** | Club: 45 minutes a week, one mentor, 8–10 kids, show-and-tell. Safeguards: group sessions only, no private chat, and a second adult present (free Google Meet can't record). It becomes a paid tier only if it clearly improves retention. |
| 5 | AI | **No AI in the MVP** | A hand-written 5-level hint ladder plus an error translator covering about 80 error patterns. Every stuck moment is logged so there's a baseline. An AI "buddy" may come in v1 as an A/B test. |
| 6 | Sharing | **Family-circle sharing** | See §6. The child names each invite ("Santosh Mama"). Visitors never sign up. Emoji and preset compliments only. Friday Showcase. Appreciation badges count unique people (3 / 10 / 25). *(The user came up with the family-sharing and showcase ideas.)* |
| 7 | Device | **Laptop first (recommended to families), but every project must be finishable on a phone** | Phone editor with a symbol bar, touch controls in the stage library, offline-capable web app. Pyodide by default, with MicroPython as a possible fallback for low-memory phones. *(The user cares about reaching kids without laptops.)* |
| 8 | Business model | **Freemium** | Free: the starter plus 2 projects (the paywall appears on the 4th project). A child's own work is **never locked**. Self-paced plan, monthly or annual (about 2 months free on annual). Club plan as premium, if the beta test passes. Pay-what-you-can on the self-paced plan with a small minimum. A pay-it-forward pool funds free seats. |
| 9 | Process | **Build first, with discovery folded into the build** | No separate research phase. Real kids from Phase 1. Every phase ends with a gate based on real usage. |

**Source documents** (Claude Docs, owned by the user):
- Strategy (13 sections plus the decision log): https://claude.ai/artifact/3gpx5Z5Pgx1Wr7qxqWEFQo. A PDF copy is at [Product_Strategy.pdf](Product_Strategy.pdf).
- MVP build plan: https://claude.ai/artifact/Mxww8CNdGNQbBaNhRaD4Jz

---

## 3. Build plan: 6 phases, about 24 weeks

This assumes one or two people building full time with AI coding help; double the durations for part-time work. Each phase ends at a **gate**. If the gate's checks fail, fix what's broken before adding anything new.

| Phase | Weeks | Build | Real users | Success checks (the gate) |
|---|---|---|---|---|
| **0 · Foundations** | 1–2 | Repo plus automatic deploys. CodeMirror 6 plus Pyodide in a Web Worker (Stop button, `input()` support). Stage library v0. Project file format. | None | First run on a basic laptop: **under 10 s uncached** and **under 3 s cached**. An endless loop **recovers within 2 s**. |
| **1 · Hook and starter** | 3–5 | Guest sandbox (no sign-up). **Name Light Show**. Milestone engine. Error translator v0 (20 errors). Hints. | 5–10 kids you can watch | **7 of 10 finish the starter alone.** 8 of 10 get their first run within 3 minutes. |
| **2 · Accounts and parents** | 6–9 | Parent login by emailed link. Child profiles on the family's device. Consent records. Onboarding. 4 projects (adds Story Machine, Guess My Number, Spiral Art). Row-level security. Weekly parent email. Data export and delete. About 50 errors. | 20–30 kids | 80% complete sign-up. 50% start a second project. |
| **3 · Show it off** | 10–13 | Publish flow. Named invites and studio pages on a **sandboxed second Pages site**. Phone-friendly viewing with touch controls. Reactions through a Worker. WhatsApp link previews. Friday Showcase. Badges (3/10/25). Scan for personal details. Projects 5–8. | 50–100 kids | 40% share. 30% still active in week 4. |
| **4 · Full MVP and payments** | 14–18 | Projects 9–12 plus a capstone. Fix projects and Bug Hunt. Razorpay paywall with pay-what-you-can and pay-it-forward. Billing. Build Club pilot with volunteer mentors. About 80 errors. Domain and legal review. | 100–200 families | **10% or more convert to paid.** Club kids' week-8 retention about 10 points higher than non-club kids. |
| **5 · Mobile creators** | 19–24 | Phone workspace, symbol bar, offline app, MicroPython decision. | 30+ phone-only kids | Every project works on phones. Phone completion within 15 points of laptop completion. |

**Where zero cost stops being possible:**
- legal review;
- sole-proprietor registration and KYC for payments;
- a domain (about ₹1,000 a year);
- Supabase Pro for backups (about $25 a month);
- email beyond about 300 a day;
- payment fees;
- paid mentors.

**Recruiting users:** grow in widening circles (friends and family, then communities). Offer a "founding families" beta deal.

**Kept out of the MVP on purpose:**
- public gallery and remixing;
- open AI chat;
- leaderboards and XP/streaks;
- blocks mode;
- collaboration and certificates;
- free-text comments.

⚠️ **The original strategy also excluded "external APIs, AI-powered and computer-vision projects" from the MVP.** The project catalogue from 2026-11-19 (§8) now includes camera projects and data projects. **Which projects go into which phase hasn't been re-decided.** See Open questions (§11).

---

## 4. Architecture and hosting

**We run no servers of our own.**

| Layer | Choice | Notes |
|---|---|---|
| Front end | **Vite + React + TypeScript** | A static single-page app. (The strategy doc suggested Next.js; the build plan replaced it with Vite.) |
| Editor | **CodeMirror 6** | Lighter and more accessible than Monaco; better on tablets and phones. |
| Python runtime | **Pyodide in a Web Worker** | Preload during onboarding and cache aggressively. Needs a Stop/interrupt button and `input()` support. MicroPython fallback is decided in Phase 5. |
| Hosting | **Cloudflare Pages** | **Not Vercel**: its free Hobby plan doesn't allow commercial use. |
| Shared projects | **A second, sandboxed Cloudflare Pages site** (separate domain), shown in an iframe | Published projects are fixed snapshots. Kid code must never run on the main app's domain. |
| Backend | **Supabase, Mumbai region (ap-south-1)** | Postgres, Auth (parent emailed-link login), Storage, **row-level security**, scheduled jobs. |
| Edge functions | **Cloudflare Workers** | Reactions (rate-limited), WhatsApp link previews, Razorpay webhooks, any cached third-party data. |
| Email | **Brevo** (free tier) | Supabase's built-in email is rate-limited. Used for magic links, the weekly parent email and the Showcase prompt. |
| Payments | **Razorpay** | UPI autopay, pay-what-you-can, pay-it-forward. |
| Analytics | **Our own Supabase tables only** | No third-party SDKs (DPDP). |

**Engineering principles:**
1. Content lives as **files in the repo**: projects, milestones, checks and hints. There is no CMS, and a preview page is enough for now.
2. Checks run in the browser for instant feedback. They are re-run on a server only where a credential depends on them.
3. The **stage library** is one small Python module of about 30 functions (sprites, shapes, text, keys, mouse, **touch**, sound, timers) drawn on a canvas, plus a browser look-alike of `turtle`. Every game supports **both keyboard and on-screen controls**.

**Content model:**

| Entity | What it holds |
|---|---|
| Concept | Prerequisites form a graph with no cycles |
| Project | 3–6 milestones, support level, starter code, reference solution, assets, customisation points |
| Milestone | Steps, plus a check |
| Step | Type: predict, fill, Parsons, write or fix; plus the hint ladder |
| Check | A behaviour test, not exact-text matching |
| Student | Linked to a guardian |
| Mastery record | Per concept: assisted vs unassisted uses |
| Project instance | The child's copy of a project |
| Event log | Runs, errors, hints, check results |

The learning path is computed, not stored.

---

## 5. How teaching works

**Each milestone takes 5–20 minutes:**
1. Goal preview: run the finished version.
2. Predict: read 3–6 lines and guess what they'll do.
3. Concept card: one idea in plain language.
4. Build, in the real project file.
5. Automated behaviour check.
6. **Make it yours:** one required personal change.
7. Quick recall of earlier concepts.

**Each project:** starter file → 3–6 milestones → Remix → optional Extend → Publish.

**Independence ladder:** Follow → Fill → Fix → Extend → Create. A child steps up one level about every fourth project. A concept counts as **mastered** only after the child uses it correctly **without hints in two different projects**.

**Hint ladder (5 levels):**
1. Where to look.
2. A reminder of the concept.
3. A similar worked example.
4. The solution with blanks.
5. The full solution, which the child must then type out and change slightly.

Hints never cost points, but they do count against mastery.

**Error translator:** turns Python errors into kid language that points to the line and the pattern, not the answer. For example: "Python doesn't know `scroe` on line 12. Did you mean `score`?" Tone rule: say "Python got confused", never "you made a mistake", and always end with a next action. It starts with 20 patterns in Phase 1 and grows to about 80 by Phase 4.

---

## 6. Family-circle sharing (Decision 6, designed with the user)

1. The child taps "Share with…" and names the person the way they call them ("Tushar", "Santosh Mama"). **Each name gets its own personal link.**
2. The link opens the child's **studio page** (all their shared work), so the same people see every new build without needing a new link.
3. Visitors **never sign up** and give no details. They play the project and react with **emoji or preset compliments only**, such as "How did you make this?!", "Make a level 2!" or "This made me laugh". There is no free text.
4. The child sees "Santosh Mama loved Catch the Falling Stars". The parent sees all activity and **can revoke any link**.

**Safeguards:**
- The parent approves the first invite.
- Links can be revoked or set to expire.
- Reactions are rate-limited.
- Unusual activity (many new devices on one link) alerts the parent.
- We store only the invite name and the reactions.
- Studio pages are hidden from search engines (`noindex`).

**Fixing the motivation dip in weeks 3–4:**
- **Friday Showcase:** the child picks their best build. The parent gets a ready-made WhatsApp message for the family circle.
- **Appreciation badges** count *distinct people* per project: First Fans (3), Crowd Pleaser (10), Family Famous (25). Only the child and parent see them.
- **Skill badges** sit alongside, such as "first bug fixed alone".
- **What to measure:** week-4 retention of kids who got appreciation in week 3, against those who didn't.

---

## 7. Visual design (locked)

**Figma file:** "yg_python — Product UI", https://www.figma.com/design/XrDteaHdxHderwnexrHpNd (in the user's student-plan team).

**Direction B, "Night Workshop", is LOCKED.** Directions A (Sunday Paper) and C (Pocket Garden) were rejected. The user wants it minimal, playful, aesthetic, uncluttered and intuitive, with serif headings and sans-serif body text.

### Typography (Google Fonts)
- **Headings:** Instrument Serif. It has only Regular and Italic. Hero size 96 px with line height 92 and letter spacing −1.5.
- **Body and UI:** Figtree (Regular, Medium, SemiBold).
- **Code:** JetBrains Mono.

### Colour tokens

| Token | Dark mode | Light mode |
|---|---|---|
| Background | `#0F1F1C` (pine) | `#F5ECDC` (cream) |
| Surface | `#162A26` | `#FFFAF1` |
| Text | `#F5ECDC` | `#0F1F1C` |
| Soft text | `#A9B8B0` | `#52665E` |
| Primary button | butter `#FFD66B` fill, pine text | **flipped:** pine `#0F1F1C` fill, butter `#FFD66B` text |
| Coral | `#FF8A65` | `#C9502C` (deep, readable as text) |
| Mint / success | `#7BE0C3` | `#13876A` |
| Blossom | `#FFB4D2` | `#C2457A` |
| Tint | `#1D3530` | `#F3E7D0` |
| Track | `#26403A` | `#E3D7C2` |
| Lines | cream at 10% | pine at 10% |
| Editor background | `#12241F` | workspace `#EFE4D0` |
| Run stage | `#0B1714` | `#0B1714` (the stage stays dark in both modes) |
| Highlight | — | butter at 35% |

**Syntax colours:**

| Mode | Text | Keyword | String | Function | Number | Comment | Line numbers |
|---|---|---|---|---|---|---|---|
| Dark | `#F5ECDC` | `#FF8A65` | `#7BE0C3` | `#FFD66B` | `#FFB4D2` | `#6F857C` | `#4F665E` |
| Light | — | `#C9502C` | `#13876A` | `#8A5A00` | `#C2457A` | `#8A978F` | `#B0A898` |

**Light-mode illustration style:** "star chart", meaning pine dots and faint orbit lines on cream. Butter-yellow is too pale for text on cream, so use `#8A5A00` for text.

### Landing page hero (final version, Figma Landing page)
**Layout:**
- A full-bleed project scene fills a 1408×868 card with 28 px corner radius.
- A **16 px border** surrounds the card. Its colour is the other mode's background: cream around dark mode, pine around light mode.
- Small navbar: wordmark "yg python" (a placeholder), the links How it works / Projects / For parents, a theme toggle and Sign in.
- **Centred text block:**
  - eyebrow "CATEGORY · PROJECT NAME";
  - a two-line serif headline;
  - two lines of subtext;
  - one button: **"Build this project →"**, which opens that project in the guest sandbox;
  - small print: "First project free · No sign-up needed".

**Carousel:**
- **10 slides**, one per featured project. The scene, eyebrow, headline, subtext and small code labels change with each slide.
- **Advances every 6 s** (allowed range 5–7 s) with a slide-left transition, and loops.
- **Controls are dots only (no project names) plus a small pause button.** The pause button is required by WCAG 2.2.2. Dot hit areas are at least 24 px, or 44 px on touch.

**Pauses automatically:**
- on hover or keyboard focus;
- when the tab is hidden;
- with **prefers-reduced-motion**: crossfade instead of slide, and no auto-advance.

**Keyboard and screen readers:** ← → keys and swipe work. The headline is `aria-live="polite"`, and each dot is labelled with its project name and "x of 10".

**Animation (build stage):** ⚠️ The user explicitly asked for this to be remembered. **Every scene is a live, looping animation** in the build; Figma only shows one still frame.
- Use light SVG or canvas, **no video**.
- The code labels type themselves in time with the scene.
- Scenes stay clear of the centred text.
- Camera scenes are always drawn, never a real webcam feed.

**The 10 hero slides, in order:**

| # | Project | Headline |
|---|---|---|
| 1 | Invisible Cloak | "Hold up a cloth. / Disappear." |
| 2 | Finger Painter | "Paint in the air / with one finger." |
| 3 | Mars Rover Rescue | "Drive a rover / across Mars." |
| 4 | Drone Delivery | "Fly a parcel / across the city." |
| 5 | Chandrayaan Lander | "Land softly / on the Moon." |
| 6 | Planet Maker | "Design a planet. / Name it after you." |
| 7 | Doodle Guesser | "Draw a number. / Watch it guess." |
| 8 | Cricket Stats Explorer | "Settle every / cricket argument." |
| 9 | Train Route Finder | "Find the fastest / train home." |
| 10 | Secret Code Machine | "Write a secret code / only family can crack." |

The user said "5 projects" but listed 10. All 10 are built; the user may still trim the list.

### Figma file map

| Page | Contents |
|---|---|
| Foundations | Empty so far. Next design task: variables (Dark/Light modes) and components. |
| Directions (pick one) | A, B (locked) and C, each with a style sheet, a hero and a workspace mock-up |
| Space concepts (B locked) | Locked style sheets (dark and light). Six space concepts (Launch Pad, Planet Maker, Rover Rescue, Mission Control, Star Creatures, Warp Speed), each with a hero and workspace in both modes. Exploratory: **not chosen as the site theme.** The user moved to the all-projects carousel instead. |
| Landing | Hero spec card (section 13:1251). Dark carousel (section 13:2, first slide 23:2). Light carousel (section 13:629, first slide 23:2039). Prototype flows "Hero carousel · Dark" and "Hero carousel · Light". |
| Workspace, Studio (share page), Parent, References | Empty: still to be designed. |

**Marketing image:** an AI-generated before/after image for Invisible Cloak exists, made by the user outside this repo. The image tool's guardrails flagged a prompt that described a child's body "vanishing", so a cat version was offered as an alternative. If you write image prompts, describe the cloth area as "shows the room behind" rather than describing a child's body disappearing.

---

## 8. Project catalogue

The full catalogue is in [project-catalogue.md](project-catalogue.md). It covers **26 projects** chosen by the user from 60 proposals. Each project has a pitch, what the kid builds, the "wow" moment, the Python it teaches, steps, sessions, phone support, how it gets shown off, and what it needs from the platform.

| Level | Projects |
|---|---|
| **1 · Spark** | Name Light Show (the starter), Rocket Launch, Spiral Art, Guess My Number, Story Machine, Pocket Money Tracker, Mars Rover Rescue |
| **2 · Maker** | Memory Match, Filter Lab, Rangoli Generator, Secret Code Machine, Comic Strip Maker, Weather Watcher, Planet Maker |
| **3 · Builder** | Snake, One-Button Flyer, Chandrayaan Lander, Drone Delivery, Cricket Stats Explorer, Invisible Cloak, Finger Painter, Air Drums |
| **4 · Inventor** | Hand Rock-Paper-Scissors, Self-Driving Car, Doodle Guesser, Train Route Finder |

**Platform pieces these projects need** (each built once, then reused):
- **Stage library**, already planned.
- **Robot simulator:** a 2D world with sensors, wind and a battery. Used by Rover, Drone and Car.
- **Camera bridge:** webcam frames at about 160×120 pass to Python, plus on-device hand tracking with **MediaPipe** (Apache 2.0) that gives Python 21 hand points.
- **Bundled datasets:** Cricsheet cricket data, a hand-made rail graph, cached weather.
- **scikit-learn in Pyodide:** its built-in `load_digits` dataset needs no download.

**Rules for camera projects** (do not drop any):
1. Frames and hand points **never leave the device**.
2. The camera is off until the kid turns it on, with a visible indicator while it's on.
3. **No face recognition, and no face storage.**
4. **Share pages never show the child's video.** They show a drawn hand skeleton replay, or the kid's code running on a stock sample video.
5. Every camera project has a no-camera path using a sample video or photo.
6. The parent dashboard lists which projects use the camera.

**Naming and licensing notes:**
- Use **"Cricket Stats Explorer"**, not "IPL Stats Explorer". IPL is a BCCI trademark.
- **Open-Meteo's free API is non-commercial.** Cache a daily snapshot through our Worker, or bundle data. Never call third-party APIs straight from a child's browser.
- Keep game art and names original: we build genres, not copies of existing games.

---

## 9. Design and tooling setup (on this machine)

- **Figma MCP** (remote, `https://mcp.figma.com/mcp`) is installed as the Figma plugin from the `anthropic-plugin-directory` marketplace.
  - Call `create_session` before any file tools.
  - Load the `figma-use` skill before any `use_figma` call. Add `figma-generate-design` for screens and `figma-generate-library` for variables and components.
- **Playwright MCP** (`npx @playwright/mcp@latest`) is installed at user scope. Use it for in-browser checks, as `DESIGN_RULES.md` requires.
- **The global `claude` CLI is old (1.0.89).** Run plugin commands with the VS Code extension's bundled binary instead: `~/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude`.
- **Figma student plan:** its terms may not allow commercial use. Revisit before launch.

---

## 10. What to do next (suggested order, each step only with the user's go-ahead)

1. **Design system in Figma:** turn the locked tokens into Figma variables (Dark/Light modes) and core components (button, chip, card, nav, editor panel, stage) on the Foundations page.
2. **Design the remaining screens:**
   - the rest of the landing page below the hero;
   - the Workspace (editor, run stage, milestone panel, hints);
   - the Studio share page (must work on phones);
   - the Parent dashboard.
3. **Phase 0 code**, in this repo:
   - Vite + React + TS;
   - CodeMirror 6;
   - Pyodide in a Web Worker with Stop and `input()`;
   - stage library v0;
   - project file format;
   - automatic deploys to Cloudflare Pages.

   Measure the Phase 0 performance gates.
4. Then Phase 1: guest sandbox, Name Light Show and the milestone engine. Recruit 5–10 kids to watch.

---

## 11. Open questions (not decided; raise them with the user)

1. **How the 26 catalogue projects map onto phases 1–4.** The build plan named Name Light Show, Story Machine, Guess My Number and Spiral Art for Phases 1–2, then "projects 5–12 plus a capstone". The catalogue adds camera, robot and data projects, which need the robot simulator and camera bridge. Which ones are in the MVP?
2. **Free-tier picks:** which two projects come free with the starter? The catalogue suggests Level 1 projects.
3. **Hero slides:** keep all 10, or cut to 5?
4. **Final product name and wordmark:** "yg python" is a placeholder. Domain to follow.
5. **Space concepts page:** archive it, or reuse its ideas as visual worlds for individual projects?
6. **Weather data source** and **legal review of the camera features** under DPDP (on-device processing, consent wording).
7. **MicroPython fallback** for low-end phones (Phase 5).

---

## 12. Repo state

**Phase 0 (Foundations) was built on 2026-11-20.** See [README.md](../README.md) for the structure, scripts and deploy steps.

- **Stack:** Vite 8, React 19, TypeScript 7, CodeMirror 6, and Pyodide 314.0.8 (Python 3.14) in a module Web Worker, self-hosted under `/pyodide/<version>/`.
- **Cross-origin isolation (COOP/COEP)** is on in dev, preview and Cloudflare (`public/_headers`). Shared memory powers Stop (interrupt buffer, then a worker restart after 0.4 s) and blocking `input()`.
- **Stage library v0** is `src/runtime/python/stage.py`. Commands are batched to the page and drawn on a canvas.
- **Project format v1:** `content/projects/<id>/project.json` plus `.py` files, validated by `npm test`. A draft Name Light Show sits there as the format example.
- **Fonts are self-hosted** (@fontsource). There are no third-party requests.
- **The app is a developer playground** (sample picker plus a "Phase 0 checks" strip). Phase 1 replaces it with the guest sandbox and the real starter project.
- **Deploy** is a direct upload to Cloudflare Pages: `npx wrangler login`, then `npm run deploy`. The user chose **not to commit yet**, so GitHub auto-deploy isn't set up.
- **Measured locally** (M-series Mac, local server):

  | Check | Result |
  |---|---|
  | Uncached start | 1.5 s |
  | Cached start | 0.9 s |
  | Stop (interrupt) | about 15 ms |
  | Stop when the program ignores the interrupt (restart) | about 1.2 s |
  | 2M-line print flood | page stayed responsive |

- **For Phase 1, the user wants the full 10-slide animated hero carousel** (answered 2026-11-20), not a simplified landing page.

### Phase 1 (Hook and starter): built 2026-11-20

- **Landing (`/`):** the full animated carousel, 11 slides. Name Light Show was added as slide 1 by the user's choice; only it is live, and the other 10 show "Coming soon".
  - Scenes are SVG plus CSS animation (`src/landing/scenes.ts`, `landing.css`).
  - Behaviour: auto-advance every 6 s; pause on hover, focus or hidden tab; reduced motion means a crossfade with no motion; dots plus a pause button; ←/→ keys and swipe.
  - Python preloads after 2.5 s unless the visitor's browser is in save-data mode.
- **Sandbox (`/play/name-light-show`):** intro (the finished light show plays as a preview), then 4 milestones and 10 steps, then the finish screen.
  - Step types: predict (pick a guess, then run), build/fill with behaviour checks, make-it-yours, recall.
  - The kid's name is remembered (`check.remember`) and filled into later steps via `{{name}}`.
  - Progress is saved in localStorage per project. Another tab changing it triggers a reload.
- **Checks** run in Python after the kid's code (`_yg_run(code, check_json)`). They see `output`, `drawn` (the stage history), `ns`, `fail()` and `remember`. `npm run test:checks` validates them in local CPython.
- **Error translator v0:** 26 patterns plus a fallback, all tested. "Did you mean" suggestions are computed in Python (difflib over the kid's own names). The error line is highlighted in the editor.
- **On-device report (`/report`, hidden):**
  - Gate cards: finished alone (no level-5 answer hint) and first run within 3 minutes.
  - A per-kid table, with "Copy as table" and "Reset for the next kid".
  - The data never leaves the browser.
- **Content format additions:** `choices`, `answer`, `explain` (for predict and recall steps), `{{name}}` templating, and check files named `check-*.py`.
- **Known gaps:**
  - The phone layout works, but creating on a phone is Phase 5.
  - Nav links other than "Start building" were left out, because those pages don't exist yet.
  - The scenes' code labels and names are placeholders, such as "AARAV".

### Pre-project onboarding with Nix and Riff: built 2026-11-20

- **Decisions (user, 2026-11-20):**
  - Onboarding stays aimed at **ages 10–14**. The brief said 7–15; Decision 2 holds.
  - The sequence follows the brief **as written**, so the first Run comes around minute 10. This replaces "projects from minute one" for beginners.
  - As a result, the Phase 1 "run code within 3 minutes" gate needs a new target. The report flags this.
- **Route `/start`.** The landing buttons send kids who haven't finished onboarding here; after that they go straight to `/play/name-light-show`. The project intro links back to it.
- **Six chapters** (`src/onboarding/script.ts`):
  1. **Meet Nix & Riff:** name or nickname (kept on the device), "Written Python before?", and an optional 7-question quick check for kids who say yes. Correct answers make those lessons optional; age is never used.
  2. **Meet Python:** sandwich ordering, hello in human languages vs Python, Python vs Java, a quiz. Skippable.
  3. **Python in the wild:** 6 fact cards, a matching game, a dream-project pick. Skippable.
  4. **Speak Python:** 7 lessons in `concepts.ts`, each following the six parts (analogy → example → tap each part → try it and run → see the result → challenge with check and hints). Challenge checks live in `content/onboarding/check-*.py` and are tested by `npm run test:checks`.
  5. **Workspace tour** (`WorkspaceTour.tsx`): 11 hands-on steps in the real workspace layout. The kid clicks, types `print("Hello, World!")`, runs, fixes a deliberate missing `)`, uses a hint, and sees the stage and progress.
  6. **Finale** → Name Light Show.
- **Mascots:**
  - Poses come from `assets/mascot/` (the user's art), trimmed to WebP in `public/mascots/` (about 40 KB each).
  - Nix is the explainer and question-asker; Riff is the energy and the cheerleader, and reacts to mistakes.
  - Riff has no "surprised" pose and Nix has no "pointing" pose; `mascots.tsx` falls back to the nearest pose.
- **Reuses:** the shared Python runner (`useCodeRun`), CodeEditor, Console, the error translator, the checks engine and the sandbox styles. Progress is saved in `yg-onboarding-v1` (localStorage); "Reset for the next kid" clears it.
- **Report:** a new Onboarding column (done in N minutes, or where the kid stopped, plus chapters skipped and quick-check score), and a gate card for onboarding completion with the median time.

### Revision, 2026-11-20 (the user's 6 changes)

1. **Carousel slide transition** is 0.35 s (was 0.6 s). Slides still change every 6 s.
2. **"New idea" pop-outs.** Steps can list `introduces: [conceptId]`, and Nix explains each concept in a pop-out the first time the kid reaches that step. The kid can reopen it from a chip on the step card.
   - Explanations live in `content/concepts.json`: coordinates, for-loops and range so far. The validator and tests check them.
   - Name Light Show introduces coordinates (step 1), for-loops (step 6) and range (step 8).
3. **The hero now explains the platform.**
   - Fixed: the eyebrow "Real Python for kids aged 9–15", a sentence saying what yg python is, a "Start learning free" button and a "See how it works" link.
   - Rotating: the headline, the "You could build ___" tag and the scene.
   - The per-slide "Coming soon" buttons are gone.
4. **Home page sections below the hero** (`LandingSections.tsx`, all using the mascots):
   - How it works (3 steps);
   - Meet your guides;
   - Real Python in your browser (with a code sample);
   - Projects grid, with id `#projects`;
   - For parents, with id `#parents`;
   - a closing call to action and a footer.

   The nav links now jump to these sections.
5. **Dialogue buttons** (Next, plus the screen's main button) sit to the right of the conversation, stacked.
6. **The experience question has two answers:** "Never" or "Yes, a bit".
   - "Yes, a bit" leads to an 11-question quick check: the 7 basics plus 4 "spot the error" questions, with shuffled choices and an "I'm not sure" option.
   - Tracks (`trackFor` in `onboarding/progress.ts`):

     | Score | Track | What happens |
     |---|---|---|
     | under 30% | Lessons | The full journey |
     | 30% to under 85% | Refresher | Refresher → workspace tour → project. The user gave 30–75% and >85%; I put the 75–85% gap with the refresher. |
     | 85% or more | Ready | Choose: straight to the project, a refresher first, or the workspace tour first |

   - The refresher (`Refresher.tsx`) shows all 7 basics with runnable examples, missed ones first, plus an errors reminder and one mini challenge (`input` and `print`).
   - Paths come from `pathFor()` in `onboarding/script.ts`; the chapter map only shows the chapters on the kid's path.

### Home page redesign: "LED board" direction (user-approved 2026-11-20)

The user rejected the rounded-card look as generic "AI slop", and `DESIGN_RULES.md` already forbids excessive rounded cards. The new direction applies to the home page now; **onboarding, lessons and the workspace come next round, in the same language.**

- **Language:** dot-matrix and LED display meets workshop.
  - Sharp corners everywhere (`border-radius: 0`).
  - 1 px hairline rules (`--line-strong`) instead of boxes.
  - Monospace uppercase labels in `[ brackets ]`, with oversized Instrument Serif headlines.
  - Square LED indicators that blink green when something is live.
  - Hard-shadow push buttons (`.led-btn`): cream shadow in dark mode, butter in light; they press in on click.
  - Colours and fonts are unchanged (locked tokens).
- **Bezel:** a fixed 16 px frame in the opposite mode's background (8 px on phones) borders the **whole page**, not just the hero.
- **Pixel field** (`fx.tsx`): a fixed canvas of LED dots across the page. Moving the mouse or a finger spawns coloured pixels that snap to the dot grid, drift with the motion and fade, with occasional idle blips. It's off with reduced motion and capped at 520 particles.
- **Haptics** (`buzz()` in `fx.tsx`): short vibrations on button presses, slide swipes, section reveals and the departure board settling. They only work on touch devices after the first tap, and are skipped with reduced motion. iPhones ignore the vibrate API, so it's Android only.
- **Hero:** slide 1 is the **platform intro** (no project): "Learn Python by building things you love.", with pixel-art icons and Nix and Riff. Slides 2 to 12 are the projects. Each slide has an eyebrow (`[ Project 04 · Robots ]`), headline, sub, "Start learning free" button and a status LED. Controls are square dots, an `01 / 12` counter and a square pause button. Scenes no longer draw star-chart backgrounds, because the dot field replaces them.
- **Sections** (`LandingSections.tsx`), each with a dot-matrix number, a mono label and a rule that draws in on scroll:
  1. How it works: 3 columns split by hairlines, with mascots rising from the rule.
  2. Guides: two halves, with terminal-style quote lines.
  3. Real Python: a typing code block beside a live LED light-show output, plus 3 facts.
  4. Projects: a departure board with split-flap category and status.
  5. Parents: a 2 × 2 grid with P/01-style numbers.
  6. A large "Ready to make something?" call to action, with mascots rising.
- **Class names:** home page classes are namespaced where they could collide (e.g. `.lp-guide`, because the sandbox already has `.guide`).
- **Onboarding:** dialogue buttons now sit outside the cast box at the bottom right, stacked (`.ob-btn-stack`).

### Round 3 (2026-11-20): catalogue page, sticky nav, app restyle

- **Hero** rotates the intro plus **Mars Rover Rescue, Drone Delivery, Chandrayaan Lander and Invisible Cloak** (`HERO_KEYS` in `landing/slides.ts`).
  - The slide controls are replaced by a small **scroll indicator**: an LED square stepping down a track, which fades out once you scroll.
  - A tiny square **pause button** stays in the corner, because WCAG 2.2.2 requires a way to pause auto-rotation.
- **Sticky site nav** (`ui/SiteNav.tsx`) on the home and catalogue pages. "Projects" jumps to the home page's projects section.
- **Home projects section** shows 8 featured projects as a departure board (every row links to that project's catalogue entry; the live one starts the project) plus an **"All projects catalogue"** button.
- **`/projects` catalogue** (`catalogue/Catalogue.tsx`) lists all 26 projects:
  - The data is generated from `docs/project-catalogue.md` by `python3 scripts/build-catalogue.py` into `src/catalogue/data.ts`. **Edit the markdown, then rerun the script.**
  - Projects are grouped by level, with dot-matrix level numbers and the level's new Python ideas.
  - The hairline-grid project sheets expand to show the wow moment, steps, show-off hook and needs.
  - Filters: level (segmented control), category and search. Deep links (`/projects#doodle-guesser`) open and highlight a project.
  - Featured and live flags live in the script (`FEATURED`, `LIVE`).
- **Whole-app LED language** (`ui/led.css`, loaded globally):
  - every page sits in the bezel through the `.shell` wrapper in `App.tsx`;
  - corner radii are 0 everywhere;
  - `.btn-primary` and `.btn-stop` are hard-shadow push buttons;
  - labels use mono uppercase;
  - speech bubbles have coloured side bars;
  - hairlines use `--line-strong`.
- **Pixel field** runs on the home, catalogue, onboarding and report pages, but not in the coding workspace or playground (it would distract). It **calms down near anything clickable**: no new pixels within about 26 px of a button, link, input or editor, and the nearby trail fades fast (`nearInteractive` in `ui/fx.tsx`).
- **Workspace** is exactly one screen tall on desktop (≥1181 px); panels scroll inside.

- **Home section 02 is now "Laptop or phone"** (2026-11-20); it replaced "Your guides".
  - Laptop or Chromebook is marked **Recommended**, with Riff's coding pose.
  - Phone or tablet is marked **Also works**, with Nix's new `mobile` pose (`public/mascots/nix/mobile.webp`, from `assets/mascot/nix/14_nix_mobile.png`).
  - "How it works" step 2 now uses Riff's pointing pose, so the coding pose isn't shown twice.
