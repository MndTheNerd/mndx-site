# 002-landing-page — Plan

> **Status:** APPROVED by autopilot · 2026-10-07
> Implements: [spec.md](spec.md)

## Approach
The page is server-rendered by Astro into static HTML. All copy lives in typed content modules under
`src/content/`, and one `.astro` component per section renders it. Two small browser modules, bundled by Astro
as external files (hashed into the CSP `script-src` automatically), add the only interactivity:
- `copy.ts` wires up the copy buttons.
- `walkthrough.ts` animates the track diagram.

Each module separates **pure logic**, unit-tested with Vitest, from **DOM wiring**, tested with Playwright
against the production build.

**Diagram state model.** The figure renders with `data-state="idle"`. The unconditioned base CSS is the
**final** state, so browsers without the `scripting` media feature (Safari < 17, Firefox < 113,
Chrome < 120) degrade to a correct static diagram. Only one rule switches to the initial state:

| Condition | Visuals shown |
|---|---|
| base (JS off, reduced motion, old browsers, `[data-state="final"]`) | **final**: route complete, both signals proceed |
| `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)` + `[data-state="idle"]` | **initial**: no route, both signals stop |
| `[data-state="playing"]` | per-element classes set by the script, step by step |
| `[data-resetting]` (one frame, set on replay) | `transition: none`, so a replay snaps back to the initial state instead of animating backwards |

The `scripting` media feature means the first paint is already correct with no inline script. Astro's CSP
doesn't hash `is:inline` scripts, so an inline flag script would be blocked. With JS off, AC8's final state
holds without the attribute ever changing. T5 proves early that Chromium reports `scripting: none` when
JavaScript is disabled in Playwright. If it doesn't, the fallback is an inline flag script whose SHA-256 we
compute in `Base.astro` and register with `Astro.csp.insertScriptHash`, with a test that the hash matches the
script. Taking that fallback is a plan amendment, re-reviewed before continuing. It adds one allowed exception
(`src/layouts/Base.astro`) to the `is:inline` source rule.

**Diagram SVGs.** There are two inline SVGs, horizontal (≥ 900 px) and vertical (< 900 px), switched by a
media query.
- Both are `aria-hidden`, with element IDs prefixed `h-` / `v-`, so no ID is duplicated.
- A visually hidden ordered list carries the meaning for screen readers.
- Each signal has both a bar shape (stop) and an arrow shape (proceed). CSS shows one of them and sets the
  color, so color is never the only cue.
- The script only toggles classes and `data-*` attributes. CSS transitions do the visual change, with
  durations from tokens. No inline styles.

Timing is a pure `timeline()` that returns ordered `{ at, step, action }` events, driven by `setTimeout`.
Playwright's `page.clock` controls the timers. CSS transitions run on real time, so the e2e tests assert classes
and `data-*` per beat, not computed mid-transition styles. The one exception is the first paint, where nothing
is transitioning.

**Content drift (AC16).** The MNDX README at `bbbd4fa` is vendored to `tests/fixtures/mndx-readme.md`. A
test-only parser extracts the install commands, the command table and the numbers, and a Vitest test compares
them with `src/content/`. The "45 curated community skills" rule title is built from `proof.skillCount`, so the
number on the page is the tested number.

**Console errors** are collected by an auto-fixture in `tests/e2e/fixtures.ts` that every spec imports. It
fails any test that logs a console error or page error (NFR-S1).

Alternatives rejected:
- A framework island (Preact or Svelte) adds a runtime, breaking the 5 KB JS budget, for two buttons and a
  timer.
- CSS-only animation still needs JS for the visibility trigger, replay and mid-run reduced motion.
- A single SVG that reflows with `viewBox` tricks is fragile at 320 px.
- An inline head script is blocked by the CSP, as explained above.

## Changes
### Data model
None at runtime. Typed content modules:
```ts
// src/content/site.ts
export const site: { repoUrl: string; installCommands: readonly [string, string]; setupCommand: string;
  requirements: readonly string[] };
export function repoFile(path: string): string; // https://github.com/MndTheNerd/mndx/blob/main/<path>
// src/content/commands.ts
export interface Command { name: string; args: string; summary: string; userOnly: boolean } // args '' when none
export const commands: readonly Command[]; // 16, README order
// src/content/proof.ts
export const proof: { app: string; majorDefects: number; testsGreen: number; skillCount: number;
  paragraphs: readonly string[] };
export const limits: readonly { key: 'watchdog' | 'legal' | 'permissions'; text: string }[];
// src/content/rules.ts (imports proof.skillCount for the skills rule title)
export interface Rule { title: string; body: string; detailPath?: string }
export const rules: readonly Rule[]; // 8, spec AC9 table
```

### Interfaces
- `src/scripts/copy.ts`
  - `copyText(text, clipboard?): Promise<'copied' | 'failed'>` (`clipboard` defaults to
    `navigator.clipboard`; missing or rejecting → `'failed'`)
  - `failureMessage(isCoarsePointer: boolean): string`
  - `initCopyButtons(root: ParentNode): void` (un-hides buttons, handles activation, label and status timers,
    reads `matchMedia('(pointer: coarse)')`, and selects the text on failure)
- `src/scripts/walkthrough.ts`
  - `STEP_MS = 700`, `SIGNAL_STOP_MS = 900`, `SIGNAL_CLEAR_MS = 300`
  - `timeline(): readonly TimelineEvent[]`
  - `runDuration(): number`
  - `shouldPlay(visibleHeight, diagramHeight, viewportHeight): boolean`
  - `initWalkthrough(figure: HTMLElement): void` (IntersectionObserver with thresholds every 0.05, plays once;
    a reduced-motion `change` listener; the replay button)
- Components: `SiteHeader`, `Hero`, `TrackDiagram`, `CopyCommand` (props: `command`), `Rules`, `Commands`,
  `Proof`, `Limits`, `Install`, `SiteFooter`.

### Files
| File | Change |
|---|---|
| `tests/fixtures/mndx-readme.md` | new: vendored README at `bbbd4fa`, with a header comment naming the commit and how to refresh it |
| `tests/unit/readme.ts` | new: test-only parser for the fixture |
| `src/content/site.ts`, `commands.ts`, `rules.ts`, `proof.ts` | new: typed page content (replaces `src/content/.gitkeep`) |
| `src/scripts/copy.ts`, `src/scripts/walkthrough.ts` | new: client logic plus DOM wiring |
| `src/components/SiteHeader.astro`, `Hero.astro`, `TrackDiagram.astro`, `CopyCommand.astro`, `Rules.astro`, `Commands.astro`, `Proof.astro`, `Limits.astro`, `Install.astro`, `SiteFooter.astro` | new: one per section or primitive (replaces `src/components/.gitkeep`) |
| `src/pages/index.astro` | modified: assemble the sections, plus a skip link to `#main` |
| `src/styles/global.css` | modified: `.visually-hidden` utility; `[hidden] { display: none !important }` |
| `tests/unit/content.test.ts` | new: AC16 |
| `tests/unit/copy.test.ts`, `tests/unit/walkthrough.test.ts` | new: pure logic for AC2, AC4, AC6 |
| `tests/unit/source-rules.test.ts` | new: NFR-A1 (no raw hex values in `src/components`) and NFR-S1 (no `innerHTML`, `eval(`, `new Function`, `style=`, `define:vars`, `is:inline` in `src/components`, `src/pages`, `src/layouts`, `src/scripts`) |
| `tests/e2e/fixtures.ts` | new: `test.extend` auto-fixture that fails on console and page errors; every spec imports `test` from here |
| `tests/e2e/page.spec.ts` | new: AC1, AC5, AC9–AC13, AC15, AC17, NFR-C1, the NFR-S1 CSP checks |
| `tests/e2e/copy.spec.ts` | new: AC2–AC4 |
| `tests/e2e/walkthrough.spec.ts` | new: AC6, AC7 |
| `tests/e2e/nojs.spec.ts` | new: AC8 |
| `tests/e2e/responsive.spec.ts` | new: AC14, AC15's 200 % zoom, the AC5 899/900 px boundary |
| `tests/e2e/budget.spec.ts` | new: NFR-P1 (reads `dist/` after the webServer build) |
| `tests/e2e/smoke.spec.ts` | modified: import from `fixtures.ts`; the `h1` assertion still holds |
| `docs/ARCHITECTURE.md` | modified at ship: component and content names, `args` not optional, no-JS behavior of the diagram |

## Tasks
- [x] T1 Vendor the README fixture and write `tests/unit/readme.ts`. Write `content.test.ts` (red), then the four
      content modules (green). (AC16)
- [x] T2 `copy.ts` pure logic with `copy.test.ts`: success, missing API, rejected write, and wording for fine and
      coarse pointers. (AC2, AC4)
- [x] T3 `walkthrough.ts` pure logic with `walkthrough.test.ts`: event order, 4 × 700 ms segments, two
      900 + 300 ms signal beats, total 5200 ms ≤ 8000, and `shouldPlay` for tall and short diagrams. (AC6)
- [x] T4 `tests/e2e/fixtures.ts`, then the static page:
      - `global.css` utilities
      - `SiteHeader`, `Hero` (`h1`, lead, two `CopyCommand`s with `hidden` buttons), `Rules`, `Commands`,
        `Proof`, `Limits`, `Install`, `SiteFooter`, plus the `index.astro` assembly and skip link

      Then `page.spec.ts` for AC1, AC9–AC13, AC15, AC17, NFR-C1 and the CSP checks. Buttons are asserted to
      exist in the DOM here; visibility comes in T6. Switch `smoke.spec.ts` to the fixture.
- [x] T5 `budget.spec.ts` (NFR-P1, including inline module script bodies in `dist/index.html`). Measuring
      early catches a font-budget problem before more is built.
- [x] T6 `TrackDiagram.astro` with the state model CSS, plus `nojs.spec.ts` (AC8). This proves early that
      `scripting: none` matches with JS disabled; if it doesn't, the hashed-inline fallback described in
      Approach applies. AC5 assertions in `page.spec.ts`, and the boundary in `responsive.spec.ts`.
- [x] T7 Wire `initCopyButtons` and write `copy.spec.ts`:
      - clipboard permissions granted
      - API removed by `addInitScript`
      - coarse pointer: `hasTouch` + `isMobile`, asserting `matchMedia('(pointer: coarse)')` inside the test
      - the status clears on the next activation and after 6 s
      - the visibility assertions for AC1 and AC12
- [x] T8 Wire `initWalkthrough` and write `walkthrough.spec.ts` with `page.clock`:
      - first-paint initial state
      - "before view" at 390×844, where the diagram starts below the threshold
      - plays immediately at 1280×800
      - plays once: scroll away and back, no second run
      - finishes when scrolled away mid-run
      - loaded already past the threshold
      - replay disabled during a run
      - reduced motion from the start
      - reduced motion switched on mid-run
      - (AC6, AC7)
- [x] T9 `responsive.spec.ts` at 320, 390, 768, 1280 and 640 (zoom) px, plus `source-rules.test.ts`. Run the
      full quality bar.

## Test plan
| AC | Test (type · location) |
|---|---|
| AC1 | e2e · `page.spec.ts`: header wordmark and GitHub link, `h1` text, lead mentions "Claude Code plugin", both commands in the DOM; bounding boxes inside the viewport at 1280×800 (h1, lead, both commands) and 390×844 (h1, lead). `copy.spec.ts`: the copy buttons are visible with JS |
| AC2 | unit · `copy.test.ts`: `copyText` returns `'copied'` and writes the exact string. e2e · `copy.spec.ts`: clipboard read-back equals the command, label "Copied", live region "Copied", reverts after 2 s (clock), double activation restarts the timer |
| AC3 | e2e · `copy.spec.ts`: Tab to the button, Enter and Space each copy; accessible name "Copy: <command>" |
| AC4 | unit · `copy.test.ts`: missing or rejecting clipboard → `'failed'`; `failureMessage(false/true)`. e2e · `copy.spec.ts`: no API → the selection equals the command, the label stays "Copy", the status text for fine and coarse pointers, clears after 6 s and on the next activation |
| AC5 | e2e · `page.spec.ts`: SR list has 7 items in order; both SVGs `aria-hidden`; 5 stations and 2 `/mndx:approve` labels; each signal has a bar and an arrow shape; with `reducedMotion: 'reduce'` (final visuals) each signal shows the arrow; no duplicate IDs. `responsive.spec.ts`: horizontal SVG visible at 900, vertical at 899 |
| AC6 | unit · `walkthrough.test.ts`: timeline and `shouldPlay`. e2e · `walkthrough.spec.ts`: the cases in T8, asserting classes and `data-state` per beat after `clock.runFor`. Each viewport case first asserts its precondition by computing the visible part of the figure against the threshold from its bounding box. After a replay click, the initial-state classes are present at `runFor(0)` |
| AC7 | e2e · `walkthrough.spec.ts`: `reducedMotion: 'reduce'` → final visuals, replay hidden, copy button `transition-duration` ≈ 0; emulating reduce mid-run → `data-state="final"`, button hidden |
| AC8 | e2e · `nojs.spec.ts`: all `h2`s and commands present, copy and replay buttons not visible, signals show the proceed arrow (computed `display` on the arrow shape), the route is drawn |
| AC9 | e2e · `page.spec.ts`: 8 rule titles in order (the skills rule says 45), detail hrefs exactly per the spec table, the router rule says "a set of production concerns" |
| AC10 | e2e · `page.spec.ts`: `<table>` with a `<caption>`, 16 rows in README order, "You only" on exactly approve, abandon and autopilot, glyph `aria-hidden` |
| AC11 | e2e · `page.spec.ts`: proof contains "16" and "76" and a CHANGELOG link; 3 limit items including "legal advice" |
| AC12 | e2e · `page.spec.ts`: requirements text, an `<ol>` with 3 steps, 3 command blocks, a GETTING-STARTED link |
| AC13 | e2e · `page.spec.ts`: every `a[href]` is `#…` or under the repo URL; none has `target` |
| AC14 | e2e · `responsive.spec.ts`: `<html>` scrollWidth ≤ clientWidth at each width; each command block's own `scrollWidth` ≤ `clientWidth` or `overflow-x` is `auto`; the table wrapper has `overflow-x: auto`; the caption is visible; command cells are `white-space: nowrap` |
| AC15 | e2e · `smoke.spec.ts` (axe light and dark) and `page.spec.ts`: landmarks, one `h1`, only `h2`s for sections, a focus outline on each tabbable element, target sizes ≥ 24 px. `responsive.spec.ts` at 640 px: no clipped headings, paragraphs or list items |
| AC16 | unit · `content.test.ts`: install and setup commands, 16 commands (names, args, order, "You only" from "**You only.**"), 16 and 76, 45, and limits by "watchdog", "aren't legal advice", "permissive permission mode" |
| AC17 | e2e · `page.spec.ts`: footer text "MIT licensed" with a LICENSE link, the repo, Getting Started and CHANGELOG links, and the "isn't affiliated with Anthropic" line |
| NFR-P1 | e2e · `budget.spec.ts`: gzip(HTML) + gzip(referenced CSS and JS) + raw WOFF2 for the used weights ≤ 100 KB; external JS plus inline module script bodies ≤ 5 KB gzip |
| NFR-P2 | verify · Lighthouse mobile against `astro preview` (Performance, Accessibility, Best Practices ≥ 95, LCP < 2.0 s); re-checked on the live URL in 004 |
| NFR-S1 | e2e · `page.spec.ts`: CSP meta has no `unsafe-` and no `http` origins. `fixtures.ts`: zero console and page errors in every spec. unit · `source-rules.test.ts`: the banned APIs and attributes |
| NFR-A1 | axe (AC15) plus `source-rules.test.ts` |
| NFR-C1 | e2e · `page.spec.ts`: none of the banned words; no element has a computed `text-transform: uppercase` |

## Concern coverage
| Concern | Design decision | Proven by |
|---|---|---|
| Testing | Pure logic split from the DOM; e2e against the production build; `page.clock`; emulation for motion, JS, touch and zoom; shared console-error fixture | the test plan; `mndx.js check` |
| Security | Only bundled module scripts (Astro hashes them), no inline scripts, class toggling instead of inline styles, `textContent` only, links limited to the repo | `page.spec.ts` (CSP, links), `source-rules.test.ts`, `fixtures.ts`; semgrep and `npm audit` at verify |
| Product & UX | Tokens only; one primary action (copy); success and failure states | `copy.spec.ts`, `source-rules.test.ts`, light and dark screenshots at verify |
| Accessibility | Landmarks, skip link, SR list for the diagram, live regions, focus ring, 24 px targets, reduced motion, shape plus color signals | axe in `smoke.spec.ts`, `page.spec.ts`, `walkthrough.spec.ts`, a keyboard-only pass at verify |
| Web frontend | Typed content modules; progressive enhancement through `scripting` media queries | `content.test.ts`, `nojs.spec.ts` |
| Performance | No framework, two small modules, Latin fonts, inline SVG | `budget.spec.ts` (T5), Lighthouse at verify |
| SEO | Semantic headings, real text | `page.spec.ts` heading checks |

## Risks & mitigations
- **The weight budget is tight with 4 font files** (about 65 KB of WOFF2). T5 measures early. If it fails,
  dropping a weight changes DESIGN-SYSTEM.md (`--step-1` uses 600), which is a design change: stop, update
  the spec, plan and design system, and re-review before continuing.
- **`scripting` media feature with JS disabled:** proven in T6, with a defined fallback (hashed inline flag via
  `Astro.csp.insertScriptHash`).
- **Clipboard in headless Chromium:** grant `clipboard-read` and `clipboard-write` in the test context.
  localhost is a secure context.
- **Fake clock vs IntersectionObserver and CSS transitions:** IntersectionObserver isn't a timer, so it fires
  normally under `page.clock`. The tests assert classes and `data-*`, not mid-transition computed styles.
- **Content drift after the README changes:** the fixture is pinned. Refreshing it is a documented manual
  step.

## Decisions
- No new ADR. The approach follows ADR 0001 (static Astro, no framework runtime). The `scripting` media query
  instead of an inline flag script is recorded here because of the CSP limitation.
