# 002-landing-page — Landing page

> **Status:** APPROVED by autopilot · 2026-10-07
> Kind: feature · Created: 2026-10-07

## Problem
The site is a placeholder. Claude Code users arriving from a shared link need to understand, within one screen,
that MNDX stops Claude from writing code until they approve the spec and plan. They need to trust it, and be
able to install it in two commands without leaving the page. This item builds the whole page described in
PRODUCT.md's v1 scope lines 1–5, using DESIGN-SYSTEM.md. It replaces backlog items 2–4, which are one page and
ship together.

## Content source of truth
The MNDX README at commit `bbbd4fa` (github.com/MndTheNerd/mndx). It is vendored as
`tests/fixtures/mndx-readme.md`, with the commit recorded in a header comment, so tests can compare the page's
content against it offline (AC16).

Three deliberate differences from that README:
- **No concern count.** The README says "20 production concerns", but MNDX's `config/concerns.json` defines 21
  (dates/times was added in 0.3.0). The page says "a set of production concerns" and names examples, so it
  can't go stale.
- **No "repo is private" note.** The repo is public now; that README line is stale upstream.
- **A footer disclaimer** that the site isn't affiliated with Anthropic (AC17), because the page names Claude
  Code throughout.

The README no longer credits OBX (removed in `bbbd4fa`), so the page doesn't either.

## Concerns
| Concern | Why it applies | Checklist · skills | Adds to this item |
|---|---|---|---|
| Testing | always | testing.md · tdd, playwright-best-practices | Every AC has a Vitest or Playwright test. Clipboard, motion, viewport, zoom and JS-off are tested with Playwright emulation, not real OS state. Lighthouse (NFR-P2) is the one verify-only check. |
| Security | always; the page adds client scripts | security.md · security-and-hardening, sharp-edges | The CSP stays strict (NFR-S1). No `innerHTML`, `eval`, or inline `style=""` attributes. Every external link goes to github.com/MndTheNerd/mndx only and opens in the same tab (AC13). |
| Product & UX | the page is the product | ux.md · frontend-design, web-design-guidelines | One primary action: copy the install commands (AC1, AC12). DESIGN-SYSTEM.md tokens only (NFR-A1). Copy success and failure states (AC2–AC4). 320 px to wide desktop (AC14). Plain copy (NFR-C1). Light and dark screenshots are a verify-only review item. |
| Accessibility | public page | accessibility.md · accessibility | WCAG 2.2 AA (AC15): landmarks, one `h1`, keyboard copy (AC3), live-region status, a text alternative for the diagram (AC5), reduced motion (AC7), 24 px targets, 200 % zoom. A manual keyboard-only pass is a verify-only item. |
| Web frontend | static Astro page with two small scripts | stack-web · frontend-ui-engineering | Content lives in typed modules under `src/content/` and is checked against the README (AC16). Progressive enhancement: the page works with JS off (AC8). |
| Performance | shared links open on phones | performance-optimization, core-web-vitals | NFR-P1 (automated weight budget), NFR-P2 (Lighthouse at verify) |
| SEO | content structure only | seo | Semantic headings and real text (AC15). Metadata, Open Graph, sitemap content and JSON-LD are item 003. Lighthouse SEO is checked there. |

Dropped: **Data**. The router matched "table", but here that's an HTML table, and nothing is stored.

## Users & scenarios
- When I tap a link to MNDX on my phone, I want to see what it does before I scroll, so that I can decide
  whether it's worth reading on.
- When I'm convinced, I want to copy the install commands with one tap each, so that I can paste them into my
  terminal without typos.
- When I'm skeptical of AI-tool marketing, I want to see the real commands, the dogfooding numbers and the
  limits, so that I can judge it myself.
- When I use a keyboard, a screen reader, reduced motion or no JavaScript, I want the same information.

## User stories
- As a Claude Code user, I want to see how the approval gate works in a few seconds, so that I get the idea
  without reading docs.
- As a convinced visitor, I want copy buttons on the install commands, so that installing takes two pastes.
- As a skeptical developer, I want the full command list, proof and limits, so that I can trust it.

## Acceptance criteria
Install commands: `claude plugin marketplace add MndTheNerd/mndx` and `claude plugin install mndx@mndx`. The
setup step is `/mndx:skills install all`. Repo links use `https://github.com/MndTheNerd/mndx/blob/main/<path>`,
pointing at the default branch, not a pinned commit.

- **AC1 (hero)** Given a visitor opens the page, then they see:
  - a site header with the "MNDX" wordmark and a "GitHub" link to `https://github.com/MndTheNerd/mndx`
  - one `h1` reading "Claude doesn't write code until you say go."
  - a lead paragraph that names MNDX as a Claude Code plugin
  - both install commands, each with a copy button

  At 1280×800 the `h1`, the lead and both commands are inside the first viewport. At 390×844 the `h1` and the
  lead are inside the first viewport.
- **AC2 (copy, pointer)** Given clipboard access is available, when the visitor activates a command's copy
  button, then:
  - the clipboard contains exactly that command, with no prompt character and no trailing whitespace
  - the button's visible label changes from "Copy" to "Copied"
  - the section's polite live region is emptied and then set to "Copied", so a second copy is announced again
  - 2 seconds after the latest activation, the label returns to "Copy" and the live region clears
- **AC3 (copy, keyboard)** Given a keyboard user, when they Tab to a copy button and press Enter or Space, then
  the same result as AC2 happens. The button's accessible name is "Copy: <command>".
- **AC4 (copy fails)** Given the Clipboard API is missing or rejects the write, when the visitor activates a copy
  button, then:
  - the command's text is selected on the page
  - the button label stays "Copy"
  - a visible status next to the command, also put in the live region, says "Press Ctrl+C or ⌘C to copy". On a
    coarse pointer (touch), it says "Select the command and copy it" instead
  - the status clears after 6 seconds or on the next activation
  - no error appears in the console
- **AC5 (track diagram)** Given the hero, then a track diagram shows five stations in this order: spec, plan,
  build, verify, ship. It has two signals labelled `/mndx:approve`, one between spec and plan and one between
  plan and build. Each signal pairs its color with a shape: a bar for stop, an arrow for proceed. Screen readers
  get an equivalent ordered list of those seven steps, and the SVG is `aria-hidden`. The diagram runs
  horizontally when the viewport is 900 px wide or more, and vertically below that.
- **AC6 (walkthrough)** Given motion is allowed and JavaScript runs:
  - **Before it plays,** the diagram is in its initial state: no active route, both signals at stop. This
    state applies from the first paint, with no inline script: CSS selects it through the
    `@media (scripting: enabled)` feature. That way desktop visitors never see the final state flash first.
    Browsers without that feature fall back to the final state.
  - **Trigger:** it plays once, the first time the visible part of the diagram is at least the smaller of half
    the diagram's height and half the viewport's height. This works at 390×844, where the vertical diagram can
    be tall.
  - **Sequence:** the route advances one track segment at a time (4 segments, 700 ms each). At each signal it
    stops for 900 ms with the signal at stop, then that signal's `/mndx:approve` label is highlighted and the
    signal switches to proceed (300 ms), and the route continues. It ends in the final state: route complete,
    both signals at proceed. The whole run takes about 5.2 seconds and never more than 8.
  - **Scrolling away** mid-run doesn't stop it; it finishes.
  - **"Run it again"** replays the run from the initial state, and is disabled while a run is playing.
- **AC7 (reduced motion)** Given `prefers-reduced-motion: reduce`, then nothing animates (including the copy
  buttons' color transition), the diagram renders in
  its final state, and the "Run it again" button isn't shown. If the preference switches to reduce while the page
  is open, a run in progress jumps to the final state, and the button is hidden.
- **AC8 (no JavaScript)** Given JavaScript is disabled, then every section's text is present, every command is
  visible as selectable text, the diagram shows its final state, and no copy or replay buttons are shown,
  because they couldn't work.
- **AC9 (what changes)** Given the "What changes" section, then it lists these eight rules, each with a title and
  one or two sentences, and a detail link where one exists:

  | Rule | Detail link (`blob/main/…`) |
  |---|---|
  | Hard gate | `docs/HOW-IT-WORKS.md` |
  | Verified, not claimed | `docs/HOW-IT-WORKS.md#ship-rules-checkjs` |
  | Concern router ("a set of production concerns", named examples, no count) | `docs/CONCERNS.md` |
  | 45 curated community skills | `docs/SKILLS.md` |
  | Independent reviewers | `docs/GUIDE.md` |
  | Existing projects: rebuild, fix or keep | `docs/EXISTING-PROJECTS.md` |
  | Autopilot | `docs/AUTOPILOT.md` |
  | Runs on your Claude subscription: no API keys, no servers | none |
- **AC10 (commands)** Given the "Commands" section, then a `<table>` with a caption lists all 16 commands from the
  README's table, with their arguments and descriptions, in the README's order. `/mndx:approve`,
  `/mndx:abandon` and `/mndx:autopilot` are marked with the visible text "You only", next to a red bar glyph that
  is `aria-hidden`, so the marker never depends on color alone.
- **AC11 (proof and limits)**
  - **Proof:** the section states the dogfooding results: a habit tracker built end to end under autopilot, 16
    major defects found by the reviewers before shipping, and a typecheck/build failure caught while all 76 tests
    were green. It links to `CHANGELOG.md`.
  - **Limits:** the section lists the README's three limits in plain language, including that the checklists
    aren't legal advice.
- **AC12 (install)** Given the "Install" section, then it lists the requirements (Claude Code, Node.js 18+, Git)
  and three numbered steps:
  1. add the marketplace
  2. install the plugin
  3. in a Claude Code session, run `/mndx:skills install all`, then start a new session

  Each command has a copy button. There is a link to `docs/GETTING-STARTED.md`.
- **AC13 (links)** Given the page, then every `<a href>` is one of: a same-page fragment (`#…`), or
  `https://github.com/MndTheNerd/mndx`, or a path under `https://github.com/MndTheNerd/mndx/blob/main/`. No link
  uses `target="_blank"`.
- **AC14 (responsive)** Given viewport widths of 320, 390, 768 and 1280 px, then the document never scrolls
  horizontally (`scrollWidth` ≤ `clientWidth` on `<html>`). Command blocks wrap or scroll inside their own
  block. The commands table sits in a wrapper that scrolls horizontally on its own if needed; its caption stays
  visible, and command names don't break mid-word.
- **AC15 (accessibility)** Given light and dark color schemes, then:
  - axe reports zero WCAG 2.2 AA violations.
  - The page has `header`, `main` and `footer` landmarks, exactly one `h1`, and section headings as `h2` with no
    skipped levels.
  - Every interactive element shows the focus ring when focused from the keyboard.
  - Interactive targets are at least 24×24 px.
  - **200 % zoom,** emulated as a 640 px-wide viewport (1280 px at 200 %): the document doesn't scroll
    horizontally, and no text element is clipped (`scrollWidth` ≤ `clientWidth` for every heading, paragraph
    and list item).
- **AC16 (content matches the README)** Given the vendored README snapshot, then a unit test proves that
  `src/content/` matches it on: the two install commands; the setup command; all 16 command names, in order,
  with their arguments and "You only" flags; the proof numbers 16 and 76; the community skill count 45; and the
  three limits, matched by their key phrases: "watchdog", "aren't legal advice" and "permissive permission
  mode".
- **AC17 (footer)** Given the footer, then it shows:
  - "MNDX is MIT licensed" with a link to `LICENSE`
  - links to the repo, the Getting Started guide and `CHANGELOG.md`
  - the line "This site isn't affiliated with Anthropic.", because Claude Code is named throughout

## Edge cases & errors
- Clipboard permission denied or API missing (old browser, insecure context): AC4.
- Double-activating a copy button: the 2 s timer restarts from the latest activation, and the label never gets
  stuck on "Copied" (AC2).
- Diagram already past the threshold when JS loads (deep link or fast scroll): it plays right away, once (AC6).
- Reduced motion switched on mid-session: AC7.
- Very narrow screens (320 px): AC14.
- Fonts fail to load: the fallback system font keeps the layout usable (`font-display: swap`).
- JavaScript disabled: AC8.
- JavaScript on but the walkthrough script never runs (blocked or failed to load): the diagram stays in its
  initial state, with both signals at stop. This is accepted for v1. The screen-reader list and the caption
  still explain the whole flow, and the copy buttons stay hidden in the same case, so nothing is broken or
  misleading.

## Non-functional requirements
- **NFR-P1 (weight, automated):** a test sums the following for the built page, and the total is ≤ 100 KB:
  - the gzip size of `dist/index.html`
  - the gzip size of every CSS and JS file it references
  - the raw size of every WOFF2 file those stylesheets reference for the weights the page uses

  Client JavaScript is ≤ 5 KB gzip in total, with no framework runtime.
- **NFR-P2 (speed, verify-only):** Lighthouse (mobile, against `astro preview`) scores ≥ 95 in Performance,
  Accessibility and Best Practices, with LCP < 2.0 s. It's recorded in verify.md. `astro preview` serves files
  uncompressed, so this is a conservative lower bound. The deployed URL is re-checked in item 004. SEO ≥ 95 is
  checked in item 003, once the metadata exists.
- **NFR-S1 (security, automated):** the built page's CSP contains no `unsafe-inline`, `unsafe-eval` or
  third-party origins. The source has no `innerHTML`, `eval` or `new Function`, and no inline `style=` attributes
  or `define:vars` anywhere in `src/components`, `src/pages` or `src/layouts`. There are zero console errors on load and during every interaction tested.
- **NFR-A1:** text contrast is ≥ 4.5:1 (≥ 3:1 for large text and UI parts) in both themes, checked by axe.
  Components use tokens only, with no raw hex values (checked by a lint-style test on `src/components`).
- **NFR-C1 (content, automated):** the copy is sentence case, with no all-caps labels and no eyebrows above
  headings. A test checks the page text for a banned-word list of marketing superlatives: "revolutionary",
  "game-changing", "blazing", "seamless", "effortless", "supercharge", "10x", "magic". The page states only
  what the README states, plus the three documented differences above.

## Out of scope
- Page metadata beyond the existing title and description: Open Graph image, JSON-LD, social cards (item 003).
- Deploying (item 004).
- Typing out `/mndx:approve` letter by letter in the walkthrough. The label is highlighted instead.
- A video or screen recording, analytics, a theme switch, translations.
- Fetching content from the mndx repo at build time (PRODUCT.md "Later"). The vendored snapshot is updated by
  hand.

## Open questions
- None. Assumptions, accepted under autopilot and listed in the autopilot report:
  - the headline "Claude doesn't write code until you say go."
  - the section order (hero, what changes, commands, proof, limits, install, footer) from DESIGN-SYSTEM.md
  - the "not affiliated with Anthropic" footer line
