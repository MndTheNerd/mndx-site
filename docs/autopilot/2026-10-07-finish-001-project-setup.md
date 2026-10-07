# Autopilot report: finish 001-project-setup

> Goal: finish 001-project-setup
> Started: 2026-10-07 11:54 (+03:00) · Finished: 2026-10-07 12:25 (+03:00) · Outcome: **COMPLETED**

## TL;DR
`mndx-site` now has a working, tested skeleton. It's a static Astro 7 site under `/mndx-site/` with the
interlocking design tokens in light and dark mode, self-hosted fonts, a strict same-origin CSP, a full quality
bar, CI, and a GitHub Pages deploy that only publishes when the quality bar passes. The page is still a
placeholder "MNDX" heading, so it isn't worth deploying yet. The real content is backlog items 2–5.

## Items
| Item | Kind | Outcome | Commit |
|---|---|---|---|
| 001-project-setup | chore | shipped | `0dcc1d6` |

## Results
| Check | Result |
|---|---|
| Format / lint / typecheck | ✅ / ✅ 0 warnings / ✅ 0 errors, 0 hints |
| Unit tests | 6 passed, 0 failed |
| E2E (production build, axe light + dark) | 8 passed, 0 failed |
| Build | ✅ |
| semgrep (p/default + p/github-actions) | 0 findings on 32 files |
| npm audit | 0 vulnerabilities |
| gha-security-review | 0 findings |
| Code review (`mndx:code-reviewer`) | 1 major + 5 minor, all fixed |

## Decisions made without you
- **Approved `chore.md` myself** after a self-check, as autopilot allows for chores.
- **Deploy now waits for the quality bar.** The reviewer caught that the planned `deploy.yml` would publish even
  when CI failed. `ci.yml` is now a reusable workflow that `deploy.yml` runs first. As a result, pushes to `main`
  show a single "Deploy to GitHub Pages" run that contains the CI job, not two separate runs.
- **Node ≥ 22.12** instead of the planned ≥ 20, because Astro 7 requires it.
- **TypeScript 6.0.3**, not 7: `astro check` and `typescript-eslint` don't support TS 7 yet. The upgrade
  condition is noted in CLAUDE.md.
- **CSP via Astro's built-in `security.csp`**, so script and style hashes stay correct automatically.
- **Latin-only font subsets**, about 30 KB of fonts in total.
- **The DESIGN-SYSTEM.md heading sizes now include a `rem` term** so headings scale with browser zoom (WCAG 1.4.4).
- **Installed Playwright's Chromium v1243**, the version `@playwright/test` 1.63 needs. That's about 300 MB in
  `%LOCALAPPDATA%\ms-playwright`.

## Assumptions
- The interview answers you didn't give explicitly are still the recommended defaults recorded in
  `docs/PRODUCT.md` → Assumptions. These cover the audience, the scope, no analytics, the stack and the
  Lighthouse ≥ 95 target.
- "Finish 001-project-setup" meant this item only. I didn't start backlog items 2–6.

## Shortcuts / known gaps
- The page is a placeholder. No hero, sections, Open Graph image or JSON-LD yet (backlog 2–5).
- GitHub Pages can't send HTTP headers, so the CSP is a meta tag and can't set `frame-ancestors`. This is
  documented in ADR 0001.
- Nothing has been pushed. The `MndTheNerd/mndx-site` repo doesn't exist yet.

## Please check
1. **License (⚖, your decision).** This repo has no LICENSE and `package.json` says `UNLICENSED`. If you want
   MIT like the mndx repo, add a LICENSE file and change `package.json`.
2. **Interview defaults.** Skim `docs/PRODUCT.md` → Assumptions and `docs/DESIGN-SYSTEM.md`. Do the railway
   "interlocking" look and the no-analytics choice suit you? Changing them now is cheap.
3. **Evidence screenshots** in `docs/chores/001-project-setup/evidence/`, light and dark.
4. **Next step:** `/mndx:spec` for backlog item 2, the hero with the track-diagram walkthrough and the install
   commands. Or run `/mndx:autopilot work the backlog` to build items 2–5. Deploying (item 6) creates a public
   repo and pushes, so I'd ask you to confirm that step even under autopilot.

## If stopped: why, and what's needed from you
Not stopped. The goal is completed.
