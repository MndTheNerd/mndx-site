# 002-landing-page — Verification

> Filled in by /mndx:verify. Re-run after any fix.

## Quality bar
From `mndx.js check` (recorded in `.mndx/checks.json`), re-run after the last code change and the spec
re-approval:

| Check | Command | Result |
|---|---|---|
| Format | `npm run format:check` | ✅ |
| Lint | `npm run lint` | ✅ 0 errors, 0 warnings |
| Typecheck | `npm run typecheck` | ✅ 0 errors, 0 warnings, 0 hints |
| Tests | `npm test` | ✅ 30 passed, 0 failed (6 files) |
| E2E | `npm run test:e2e` | ✅ 51 passed, 0 failed. The full suite also passed 102/102 with `--repeat-each 2`, and the walkthrough specs 21/21 with `--repeat-each 3` |
| Build | `npm run build` | ✅ |

## Acceptance criteria → tests
| AC | Test(s) | Result |
|---|---|---|
| AC1 | `page.spec.ts` › hero (AC1) ×3; `copy.spec.ts` › shows copy buttons once JavaScript runs | ✅ |
| AC2 | `copy.test.ts` › copyText writes exactly…; `copy.spec.ts` › copies the exact command… reverts after 2 seconds; empties the live region before each "Copied"; restarts the 2 second timer | ✅ |
| AC3 | `copy.spec.ts` › copies from the keyboard with Enter / Space | ✅ |
| AC4 | `copy.test.ts` › missing API, rejected write, failureMessage ×2; `copy.spec.ts` › selects the command…; clears the message on the next activation; words the message for touch | ✅ |
| AC5 | `page.spec.ts` › track diagram (AC5) ×3; `responsive.spec.ts` › diagram orientation 900 / 899 px | ✅ |
| AC6 | `walkthrough.test.ts` ×5; `walkthrough.spec.ts` › plays immediately through every beat; disables "Run it again" during a run and replays; keeps running when scrolled away, plays only once; shows the initial state then plays once scrolled into view (390×844); plays once even when "Run it again" is used before the automatic run; keeps keyboard focus on "Run it again"; plays right away with the diagram already in view | ✅ |
| AC7 | `walkthrough.spec.ts` › with reduced motion from the start; jumps to the final state when reduced motion is switched on mid-run | ✅ |
| AC8 | `nojs.spec.ts` › reads completely without JavaScript (also proves `scripting: none`) | ✅ |
| AC9 | `page.spec.ts` › lists the eight rules with their detail links | ✅ |
| AC10 | `page.spec.ts` › lists all 16 commands and marks the user-only ones | ✅ |
| AC11 | `page.spec.ts` › states the proof and the limits | ✅ |
| AC12 | `page.spec.ts` › shows requirements and three install steps | ✅ |
| AC13 | `page.spec.ts` › links only to this page and the MNDX repo, in the same tab | ✅ |
| AC14 | `responsive.spec.ts` › never scrolls sideways at 320 / 390 / 768 / 1280 px | ✅ |
| AC15 | `smoke.spec.ts` › axe WCAG 2.2 AA light + dark; `page.spec.ts` › landmarks and headings; focus ring and 24 px targets; `responsive.spec.ts` › 200 % zoom | ✅ |
| AC16 | `content.test.ts` ×6 against `tests/fixtures/mndx-readme.md` (`bbbd4fa`) | ✅ |
| AC17 | `page.spec.ts` › has the footer licence, links and disclaimer | ✅ |
| NFR-P1 | `budget.spec.ts`: 74.2 KB total (63.8 KB fonts in 4 files, 1.4 KB JS gzip) against limits of 100 KB and 5 KB | ✅ |
| NFR-P2 | Lighthouse 12 mobile against `astro preview`: Performance 100, Accessibility 100, Best Practices 100; LCP 1.4 s, CLS 0, TBT 0 ms | ✅ |
| NFR-S1 | `page.spec.ts` › strict same-origin CSP; `fixtures.ts` zero console/page errors in every spec; `source-rules.test.ts` ×6 | ✅ |
| NFR-A1 | axe (AC15); `source-rules.test.ts` › no raw hex colors in components | ✅ |
| NFR-C1 | `page.spec.ts` › plain copy: no superlatives, no all-caps text | ✅ |

## Live run
`npm run preview -- --port 4330`, driven with `playwright-cli` in Chromium.

| Flow | Steps | Observed | Evidence |
|---|---|---|---|
| AC1 hero, desktop | Open at 1280×800 | Headline, lead and both commands with Copy buttons in view; diagram below in its final state after autoplay | `evidence/desktop-light-hero.png`, `evidence/desktop-dark-hero.png` |
| AC1 hero, phone | Resize to 390×844 | Headline and lead in view, commands wrap inside their blocks, vertical diagram starts below | `evidence/phone-light-hero.png` |
| AC2 copy | Grant clipboard, click the first Copy | Label "Copied", clipboard = `claude plugin marketplace add MndTheNerd/mndx`, label back to "Copy" after 2.2 s | `evidence/desktop-copied.png` |
| AC6 walkthrough | Click "Run it again" after autoplay | `data-state=playing`, button disabled; mid-run snapshot shows the route stopped at the signals; `final` after 6 s | `evidence/desktop-walkthrough-midrun.png` |
| AC3/AC15 keyboard | Tab through 40 stops from the top | Logical order: skip link, GitHub, copy ×2, rule links, table, changelog, install copy ×3, guide, footer links. Every stop showed a solid focus ring | playwright-cli log (recorded above) |
| AC9–AC12, AC17 full page | Full-page screenshots | All sections render in light and dark mode. Rules align top. The commands table fits 390 px without sideways scroll | `evidence/desktop-light-full.png`, `evidence/phone-light-full.png`, `evidence/phone-dark-full.png`, `evidence/desktop-light-rules.png`, `evidence/phone-light-commands.png` |
| NFR-S1 | Console during all of the above | 0 messages, 0 errors | playwright-cli console |

The live run caught two layout problems that no test had flagged, and both were fixed. First, on phones the commands table squeezed its descriptions into very tall rows. Arguments now wrap at spaces and after `|`, names never break, and descriptions have a minimum width; the AC14 test now asserts that names don't wrap. Second, the rules' title-to-body spacing was uneven on desktop (fixed with `align-content: start`).

## Concern checklists
| Concern | Checklist result | Evidence |
|---|---|---|
| Testing | ✅ Every AC has an automated test, at the planned seams. Deterministic: frozen `page.clock` before navigation, emulation for motion, JS, touch and zoom. No sleeps in tests | test tables above; repeat runs |
| Security | ✅ CSP has no `unsafe-*` and no third-party origins. Only bundled module scripts (Astro hashes them). `textContent` only. No inline styles. Links only to the repo | semgrep (p/default, p/javascript, p/typescript) on 56 files: 0 findings; `npm audit`: 0 vulnerabilities; `source-rules.test.ts`; CSP test |
| Product & UX | ✅ Tokens only. One primary action (copy). Success and failure states. Light and dark checked visually | screenshots; `copy.spec.ts` |
| Accessibility | ✅ axe 0 violations in light and dark. Landmarks, skip link, one `h1`, `h2`/`h3` order. Screen-reader list for the diagram. Live regions. Focus ring. 24 px targets. Reduced motion. Shape and color signals. Keyboard pass done | `smoke.spec.ts`, `page.spec.ts`, keyboard live run |
| Web frontend | ✅ Typed content modules checked against the README. Works with JS off | `content.test.ts`, `nojs.spec.ts` |
| Performance | ✅ 74.2 KB first load, 1.4 KB JS, no framework | `budget.spec.ts`, Lighthouse |
| SEO | ✅ (structure) Semantic headings and real text. Lighthouse SEO 92: `robots-txt` fails because `/mndx-site/robots.txt` isn't at the domain root. Deferred to item 003 as planned | Lighthouse |

## Code review
`mndx:code-reviewer`: CHANGES REQUIRED (2 major, 8 minor). All are resolved.

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | major | `Section.astro` and other out-of-plan changes unexplained | Listed under Deviations below |
| 2 | major | verify.md unfilled | This document |
| 3 | minor | Replay before autoplay could cause a second automatic run | `run()` now disconnects the observer; new e2e test "plays once even when Run it again is used before the automatic run" |
| 4 | minor | Overlapping copy activations could orphan the reset timer | Per-block activation counter, so a stale continuation returns early |
| 5 | minor | Station 0 blinked at run start | The playing rule excludes `[data-station='0']`, matching the idle rule |
| 6 | minor | "You only" ran into the description in text and screen readers | Now "You only." plus a space, matching the README's "**You only.**" |
| 7 | minor | `aria-label` on a role-less div | `role="group"` added |
| 8 | minor | Disabling the focused replay button dropped keyboard focus | `aria-disabled` with clicks ignored while running; new e2e test that focus stays |
| 9 | minor | AC6 wording still described the inline-script approach | Spec amended to the `scripting` media feature, re-reviewed and re-approved |
| 10 | minor | The live region's empty-then-set behavior on success was untested | New e2e test records the mutation sequence `['', 'Copied']` |

## Deviations from the plan
`mndx.js scope` lists `src/components/Section.astro`. Every mechanical deviation:
- `src/components/Section.astro`: a shared `section` / `h2` / two-column wrapper extracted from the five content sections, to avoid repeating the same markup and CSS five times. No behavior change.
- `.prettierignore` adds `tests/fixtures/`, so Prettier never rewrites the vendored README.
- `src/content/proof.ts` exports `proofParagraphs` separately from `proof` (the plan had `proof.paragraphs`). The numbers stay in `proof`, which the tests compare.
- `copyText(text, clipboard)` takes the clipboard as a required argument (`undefined` = missing API) instead of defaulting to `navigator.clipboard`, so the pure function never touches globals.
- `TrackDiagram.astro` has `id="walkthrough"` (the deep-link target for the "already in view on load" test).
- `src/styles/global.css`: links get `padding-block: 0.2em`, so inline links meet the 24 px target (AC15) without changing line spacing.
- `docs/DESIGN-SYSTEM.md` wording, done during spec review: the walkthrough beat is "label lights up", not "typed", and the marker is "You only" with an `aria-hidden` glyph.
- The replay button uses `aria-disabled` instead of the `disabled` attribute (finding 8). Playwright's `toBeDisabled` and screen readers both treat it as disabled.

## Manual checks
- Keyboard-only pass: done in the live run (above).
- Lighthouse on the deployed URL, compressed by GitHub Pages: open until item 004.

## Verdict
PASS. The last `check` is green and current, every AC is proven by a test and the live run, and every review finding is fixed.
