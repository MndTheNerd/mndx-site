# 001-project-setup — Verification

> Filled in by /mndx:verify. Re-run after any fix.

## Quality bar
From `mndx.js check` (recorded in `.mndx/checks.json`) after the last code change:

| Check | Command | Result |
|---|---|---|
| Format | `npm run format:check` | ✅ all files use Prettier style |
| Lint | `npm run lint` | ✅ 0 errors, 0 warnings (`--max-warnings 0`) |
| Typecheck | `npm run typecheck` | ✅ 0 errors, 0 warnings, 0 hints |
| Tests | `npm test` | ✅ 6 passed, 0 failed |
| E2E | `npm run test:e2e` | ✅ 8 passed, 0 failed (against the production build) |
| Build | `npm run build` | ✅ 1 page, sitemap generated |

`npm ci` (Install) is exercised in CI. Locally the lockfile was produced by `npm install --save-exact`, and
`npm audit` reports 0 vulnerabilities.

## Acceptance criteria → tests
A chore has no ACs. Its "Done when" items are mapped instead:

| Done when | Test(s) / evidence | Result |
|---|---|---|
| Every quality-bar command passes | `mndx.js check` table above | ✅ |
| Placeholder page served under `/mndx-site/`, Overpass font, correct light and dark colors, no console errors | `tests/e2e/smoke.spec.ts`: "loads under the base path with one h1 and no console errors" (light + dark), "uses the design-system background for this color scheme" (light + dark), "renders the heading in self-hosted Overpass" | ✅ |
| WCAG 2.2 AA in both color schemes | `smoke.spec.ts` › "has no WCAG 2.2 AA violations" (light + dark) | ✅ |
| Same-origin CSP | `smoke.spec.ts` › "declares a same-origin content security policy" | ✅ |
| Base-path helper | `tests/unit/url.test.ts` (joinBase ×5, withBase ×1) | ✅ |
| Workflows pass `gha-security-review` with no high findings | Review recorded under Concern checklists | ✅ 0 findings |
| Generator didn't change `docs/`, `CLAUDE.md`, `CHANGELOG.md` | The generator ran in `.scratch/astro-init/` only. Its output lists only that folder. App files were written fresh, and the generated `CLAUDE.md`/`AGENTS.md` were not copied. | ✅ |

## Live run
| Flow | Steps | Observed | Evidence |
|---|---|---|---|
| Open the site (dev, desktop, light) | `npm run dev -- --port 4323`, `playwright-cli open /mndx-site/`, resize 1280×800 | Title "MNDX: a solo product team inside Claude Code", "MNDX" heading in Overpass 800 on `#E6ECEE`, console 0 errors | `evidence/desktop-light.png` |
| Phone width (light) | resize 390×844 | 16 px gutter, `scrollWidth <= innerWidth` is `true` (no horizontal scroll) | `evidence/phone-light.png` |
| Dark mode | `page.emulateMedia({ colorScheme: 'dark' })`, desktop and phone | body background `rgb(18, 28, 37)` (#121C25), light ink heading | `evidence/desktop-dark.png`, `evidence/phone-dark.png` |
| Production build | `npm run build` + `astro preview --port 4322`, `playwright-cli open` | Same rendering; CSP meta present with hashes; 0 console messages | e2e run |

## Concern checklists
| Concern | Checklist result | Evidence |
|---|---|---|
| Security | ✅ No secrets or env vars (`.env.example` says so), `.env*` ignored. No third-party resources, fonts self-hosted. Astro `security.csp` meta policy with `default-src 'self'`, `object-src 'none'`, `form-action 'none'`, `connect-src 'none'`, script/style hashes. Lockfile committed, exact versions. | semgrep `p/default` + `p/github-actions` on 32 files: 0 findings, 0 errors. `npm audit`: 0 vulnerabilities. CSP e2e test. |
| DevOps | ✅ `ci.yml` runs the full quality bar on PRs. `deploy.yml` calls it as a reusable workflow and only builds and publishes if it passes. Actions pinned to SHAs (verified against tags with `gh api`). Least-privilege permissions, with `pages`/`id-token: write` on the deploy job only. `persist-credentials: false`. | `gha-security-review`: 0 findings. `pull_request` trigger only, no `pull_request_target`, no `${{ }}` in `run:`. Push/dispatch triggers need write access. |
| Testing | ✅ Vitest (unit) and Playwright (e2e against the production build on a dedicated port) wired, deterministic, run in CI | test counts above |
| Accessibility | ✅ axe WCAG 2.2 AA clean in light and dark. `:focus-visible` ring uses `--route`. `prefers-reduced-motion` rule in place. `lang="en"`, one `h1`. | e2e |
| UX | ✅ Every DESIGN-SYSTEM.md token in `src/styles/tokens.css`, light and dark. Overpass / Overpass Mono self-hosted, Latin subset. | live-run screenshots, background e2e test |
| Performance / SEO | ✅ Static output, about 30 KB HTML+CSS+fonts for the placeholder. Canonical URL `https://mndthenerd.github.io/mndx-site/`, sitemap-index, robots.txt pointing at it. | `dist/` listing, built HTML |

## Code review
`mndx:code-reviewer` verdict: CHANGES REQUIRED → all fixed, quality bar re-run green.

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | major | `deploy.yml` published on every push to `main` regardless of CI | Fixed: `ci.yml` is now `workflow_call` + `pull_request`; `deploy.yml` runs it as job `quality-bar` and `build` `needs` it. ARCHITECTURE.md flow 3 updated. |
| 2 | minor | e2e server used port 4321 with `reuseExistingServer`, so it could hit the dev server | Fixed: port 4329, `reuseExistingServer: false` |
| 3 | minor | `--step-5` / `--step-3` differ from DESIGN-SYSTEM.md | Fixed: DESIGN-SYSTEM.md updated to the zoom-safe `rem + vw` values, with the reason |
| 4 | minor | `withBase` itself untested | Fixed: unit test with `vi.stubEnv('BASE_URL', '/mndx-site/')`. Vitest doesn't apply Astro's `base`, so the production base path is proven by the e2e tests instead. |
| 5 | minor | `src/components/` and `src/content/` missing | Fixed: `.gitkeep` in both |
| 6 | minor | No dark-mode live-run evidence | Fixed: `evidence/desktop-dark.png`, `evidence/phone-dark.png` |

## Deviations from the plan
`mndx.js scope`: no edits outside the item. Mechanical deviations from `chore.md`:
- `engines.node` is `>=22.12.0`, not `>=20`: Astro 7 requires Node 22.12+.
- TypeScript pinned to 6.0.3: `@astrojs/check` (`^5 || ^6`) and `typescript-eslint` (`<6.1`) don't support TS 7 yet.
- The CSP comes from Astro's stable `security.csp` (meta tag with hashes) rather than a hand-written meta tag. Same policy, and inline-script hashes are maintained automatically.
- Fonts import Fontsource's `latin-*` CSS so only the Latin subset ships, as DESIGN-SYSTEM.md specifies.
- ESLint uses `defineConfig` from `eslint/config` (`tseslint.config` is deprecated).
- `.prettierignore` excludes `docs/` and the MNDX markdown so Prettier never rewrites approved docs.
- `.playwright-cli/` added to `.gitignore` (session output from the browser check).
- `@playwright/test` 1.63 needed its own Chromium build (v1243), installed with `npx playwright install chromium`.

## Manual checks
- ⚖ **License: open.** No LICENSE file added, and `package.json` says `UNLICENSED` (all rights reserved). The mndx repo is MIT; choosing a license for this repo is the user's call.
- GitHub repo settings (Pages source = "GitHub Actions"): open until the release item creates the repo.

## Verdict
PASS. The last `check` is green and current, every "Done when" item is proven by a test and the live run, and every review finding (1 major, 5 minor) is fixed.
