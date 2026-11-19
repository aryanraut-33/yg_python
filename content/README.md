# Project content

Every project is a folder in `content/projects/<id>/`. The folder name **is** the project id (kebab-case).

```
content/projects/name-light-show/
├── project.json        # the manifest (format below)
├── starter.py          # what the child sees when they open the project
├── solution.py         # the reference solution (never shown in full except as hint 5)
└── step-*.py           # optional: starting code for predict / fill / fix / parsons steps
```

## project.json (formatVersion 1)

| Field | Type | Notes |
|---|---|---|
| `formatVersion` | `1` | |
| `id` | string | Must match the folder name |
| `title`, `pitch` | string | `pitch` is the one-line, kid-facing promise |
| `level` | 1–4 | Spark, Maker, Builder, Inventor (see docs/project-catalogue.md) |
| `category` | `art` `games` `space` `robots` `camera` `ai` `data` `words` | |
| `support` | `follow` `fill` `fix` `extend` `create` | Independence ladder |
| `sessions` | number | Expected 30–40 minute sittings |
| `concepts` | string[] | Concept ids taught or practised |
| `needs` | string[] | `stage` `turtle` `robot-sim` `camera` `hand-tracking` `sound` `dataset` `scikit-learn` |
| `phoneFriendly` | boolean | Must be finishable on a phone (Decision 7) |
| `draft` | boolean? | Hidden from children; relaxes the 3–6 milestone rule |
| `files.starter`, `files.solution` | file name | Must exist in the folder |
| `milestones` | Milestone[] | 3–6 per project (unless draft) |

**Milestone:** `id`, `title`, `goal` (one sentence: what they'll have made), `concepts`, `steps`.

**Step:** `id`, `type` (`predict` `build` `fill` `parsons` `fix` `make-it-yours` `recall`), `instruction` (short Markdown), optional `code` (a .py file in the folder), optional `check`, and exactly **5 `hints`** (the hint ladder):

1. Where to look.
2. A reminder of the concept.
3. A similar worked example.
4. The solution with blanks.
5. The full solution (the child then types it out and changes something).

**Check:** `kind` (`runs`, `output-contains`, `output-matches`, `python`), `value` (text or regex for the output kinds), `file` (for `python` checks), `description` (kid language). Checks test **behaviour**, never exact wording, so many correct answers pass.

Ids must be unique within a project (milestones and steps share one namespace).

## Validate

```
npm test
```

runs the validator on every project. The build doesn't block on content yet; run the tests before shipping.
