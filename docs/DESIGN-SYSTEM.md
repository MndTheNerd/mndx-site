# MNDX site — Design system

## Concept: the interlocking
MNDX's core idea is a lock: Claude can't touch code until the spec and plan are approved, and changing an
approved doc locks it again. Railway signalling solved the same problem in the 1850s with the *interlocking*,
a mechanism that makes it physically impossible to clear a signal until the route is set. The site borrows
that world: a signal-box track diagram, enamel panel colors, signage lettering. It is specific to MNDX
(a gate you can't talk your way past), and it is not a terminal-and-neon developer page.

The boldness is spent in one place: the **hero track diagram**. A change travels along the line
spec → plan → build → verify → ship and stops at two red signals. Each signal's `/mndx:approve` label lights up
and the signal turns green. Everything below the hero is quiet, typographic and disciplined.

Why not the obvious options:
- Dark terminal with a green accent: every AI dev tool looks like that, and it says "CLI", not "discipline".
- Approval stamps on paper: reads as bureaucracy, the opposite of what solo developers want.
- The SaaS card grid: MNDX's features are rules, not products. They read better as a list of rules.

## Color
Light is the diagram board, dark is the signal box at night. Red and green carry meaning only: stop and
proceed. Each is always paired with a shape (bar / arrow) and a text label, so color is never the only cue.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--board` | `#E6ECEE` | `#121C25` | page background |
| `--panel` | `#F4F7F8` | `#1A2632` | raised surfaces: command blocks, table header |
| `--ink` | `#16222D` | `#E3E9EC` | body text, track lines |
| `--ink-muted` | `#4A5A67` | `#9AAAB5` | secondary text (≥ 4.5:1 on `--board`) |
| `--rule` | `#B9C6CC` | `#2E3D4A` | hairlines, table borders |
| `--route` | `#B7791F` | `#E3A33B` | the active route on the diagram, focus ring, links on hover |
| `--stop` | `#B3261E` | `#F0605A` | red signal, "you only" commands |
| `--proceed` | `#17744C` | `#3FBF83` | green signal, verified states |

All text pairs meet WCAG AA; `--route` is used for focus rings and lines, never for small body text in light
mode.

## Type
One family, from road and rail signage: **Overpass** (an open-source descendant of Highway Gothic) for
everything, **Overpass Mono** for commands. Self-hosted WOFF2 via Fontsource, Latin subset, weights 400, 600,
800 (sans) and 400 (mono).

Scale (1.25 ratio, 18 px base, fluid between 360 px and 1200 px):

| Token | Size | Weight / leading | Use |
|---|---|---|---|
| `--step-5` | clamp(2.6rem, 1.4rem + 6vw, 4.6rem) | 800 / 1.02, tracking −0.02em | h1 only |
| `--step-3` | clamp(1.7rem, 1.2rem + 3vw, 2.3rem) | 800 / 1.1 | section headings |

The fluid sizes mix a `rem` term with `vw` so headings still grow when the user zooms (WCAG 1.4.4).
| `--step-1` | 1.25rem | 600 / 1.35 | rule titles, lead paragraph |
| `--step-0` | 1.125rem | 400 / 1.6 | body |
| `--step--1` | 0.9rem | 400 / 1.5 | captions, table detail |
| `--mono` | 0.95em | 400 / 1.5 | commands, inline code |

Rules: sentence case everywhere, no all-caps labels, no eyebrows above headings, no single highlighted word in
headlines. Body measure ≤ 68 characters.

## Layout
Left-aligned, single column on phones, a two-column "heading | content" grid from 900 px. Max content width
1200 px, 16 px side gutter on phones, 40 px from 900 px.

```
┌──────────────────────────────────────────────────────────────┐
│ MNDX                                          GitHub          │
│                                                               │
│ Claude doesn't write code                                     │
│ until you say go.                                             │
│ lead paragraph                         [install commands  ⧉]  │
│                                                               │
│ ══spec══╪[■]══plan══╪[■]══build════verify════ship══▶         │  ← track diagram (vertical on phones)
│  "/mndx:approve"  under each signal                           │
├──────────────────────────────────────────────────────────────┤
│ What changes   │ rules list (title + 2 lines each)            │
│ Commands       │ table: command · what it does · you only     │
│ Proof          │ numbers in prose, link to the changelog      │
│ Limits         │ plain list                                    │
│ Install        │ 3 steps (it is a sequence) + copy buttons    │
├──────────────────────────────────────────────────────────────┤
│ MIT · repo · docs · changelog                                 │
└──────────────────────────────────────────────────────────────┘
```

Numbered markers are used only where the content is a sequence: the pipeline stations and the install steps.

## Shape and depth
- Radius: `--radius-s: 3px` for buttons and command blocks only. Everything else is square, like an enamel sign.
- No drop shadows. Depth comes from `--panel` on `--board` and 1 px `--rule` lines.
- Track lines are 4 px `--ink`; the active route is 4 px `--route`. Signals are 14 px discs on a post.

## Motion
- One orchestrated sequence: the hero walkthrough. It runs once when the hero is in view and replays on
  request ("Run it again" button). Durations: `--dur-step: 700ms`, `--ease: cubic-bezier(.2,.7,.2,1)`.
- Copy buttons confirm with a text change ("Copied") and a 150 ms color change, nothing else.
- With `prefers-reduced-motion: reduce`, the diagram renders in its final state with all signals labelled, and
  nothing moves.

## Components
- **Track diagram:** inline SVG, horizontal from 900 px, vertical below. Text is real `<text>`/HTML, not baked
  into paths. Has a text alternative (the ordered step list) for screen readers.
- **Command block:** `--panel` background, Overpass Mono, a copy `<button>` with an accessible name
  ("Copy: claude plugin install mndx@mndx") and a polite live region.
- **Rules list:** `<dl>`-style pairs. The title is `--step-1`, the body is `--step-0` muted. A small signal glyph
  (green arrow) marks each rule. It's decorative and `aria-hidden`.
- **Command table:** a real `<table>` with a caption. "You only" commands carry a red bar glyph (`aria-hidden`)
  plus the text "You only".
- **Focus:** 3 px `--route` outline, 2 px offset, on every interactive element.
