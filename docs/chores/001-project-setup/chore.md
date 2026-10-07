# 001-project-setup — Chore: project setup

> **Status:** APPROVED by autopilot · 2026-10-07
> Kind: chore · Created: 2026-10-07

## What & why
Scaffold the Astro site described in [ADR 0001](../../adr/0001-stack.md) and
[ARCHITECTURE.md](../../ARCHITECTURE.md), with the full quality bar from [CLAUDE.md](../../../CLAUDE.md)
running green on an empty page. The chore also wires the design tokens from
[DESIGN-SYSTEM.md](../../DESIGN-SYSTEM.md) and adds CI plus the GitHub Pages deploy workflow. Every later
feature then starts from a working, tested, deployable skeleton. It builds no page content beyond a
placeholder heading and the smoke test.

## Steps
- [ ] `git init` (branch `main`).
- [ ] Scaffold with the official generator into `.scratch/astro-init/`
      (`npm create astro@latest -- --template minimal --typescript strict --no-git --no-install`), then copy
      only the generated app files into the root, so the generator can never overwrite `docs/`, `CLAUDE.md` or
      `CHANGELOG.md`.
- [ ] `astro.config.mjs`: `output: 'static'`, `site: 'https://mndthenerd.github.io'`, `base: '/mndx-site'`,
      `trailingSlash: 'always'`, `@astrojs/sitemap` integration.
- [ ] `tsconfig.json` extends `astro/tsconfigs/strictest`.
- [ ] Dev tooling (npm, exact versions pinned in `package-lock.json`): `@astrojs/check`, `typescript`,
      `eslint` + `typescript-eslint` + `eslint-plugin-astro` (flat config), `prettier` + `prettier-plugin-astro`,
      `vitest`, `@playwright/test`, `@axe-core/playwright`, `@astrojs/sitemap`, `@fontsource/overpass`,
      `@fontsource/overpass-mono`. Check each package's current docs and peer ranges first. If
      `@astrojs/check` doesn't yet support TypeScript 7, pin the newest TypeScript it does support and say why
      in the commit.
- [ ] `package.json` scripts: `dev`, `build` (`astro build`), `preview`, `format` / `format:check`
      (prettier), `lint` (eslint), `typecheck` (`astro check`), `test` (`vitest run`), `test:e2e`
      (`playwright test`, chromium only, `webServer` = `npm run build && npm run preview`).
      Also add `"engines": { "node": ">=20" }`.
- [ ] Folder layout from ARCHITECTURE.md: `src/{pages,layouts,components,content,lib,styles}`,
      `tests/{unit,e2e}`, `public/`.
- [ ] `src/styles/tokens.css` with every token from DESIGN-SYSTEM.md (light values on `:root`, dark values
      under `@media (prefers-color-scheme: dark)`), and `src/styles/global.css` (reset, body uses `--board` /
      `--ink` / Overpass, focus ring rule, reduced-motion rule).
- [ ] `src/layouts/Base.astro`: `lang="en"`, charset, viewport, title and description props, canonical URL,
      `color-scheme: light dark`, the meta Content-Security-Policy from ARCHITECTURE.md, fonts imported from
      Fontsource (self-hosted), tokens and global CSS.
- [ ] `src/lib/url.ts`: `withBase(path)` helper that joins `import.meta.env.BASE_URL` and a path, plus a
      Vitest unit test covering leading/trailing slashes and the root path.
- [ ] Placeholder `src/pages/index.astro` using `Base` with a single `h1` "MNDX".
- [ ] Smoke e2e test `tests/e2e/smoke.spec.ts`: the page loads under `/mndx-site/`, has exactly one `h1`,
      zero console errors, and zero axe violations at WCAG 2.2 AA in light and dark color schemes.
- [ ] `public/robots.txt` pointing at the sitemap; `public/favicon.svg` (a signal disc).
- [ ] `.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.scratch/`, `test-results/`,
      `playwright-report/`, `.env*` except `!.env.example`.
- [ ] `.gitattributes`: `* text=auto eol=lf`.
- [ ] `.github/workflows/ci.yml`: on push and pull_request; Node 24; `npm ci`, then the quality bar in
      CLAUDE.md order; installs Playwright chromium with deps. `permissions: contents: read`. Actions pinned to
      full commit SHAs.
- [ ] `.github/workflows/deploy.yml`: on push to `main` and `workflow_dispatch`; jobs `build`
      (`npm ci` + `npm run build` + `actions/upload-pages-artifact` with `dist/`) and `deploy`
      (`actions/deploy-pages`, environment `github-pages`); `permissions: contents: read, pages: write,
      id-token: write`; `concurrency: pages`. Actions pinned to SHAs.
- [ ] `.env.example` stating that the site needs no environment variables (no env validation needed: there is
      no runtime config).
- [ ] `README.md`: what this repo is, the quality bar commands, how deploys work, link to the mndx repo.
- [ ] Run every quality bar command locally and confirm each is green. Open the built page in a real browser
      (`playwright-cli`) in light and dark mode.

Not in this chore: creating the GitHub repo, pushing and enabling Pages. Those happen at
`/mndx:release … deploy`.

## Concerns
| Concern | What this chore does about it |
|---|---|
| Security | Meta CSP, no third-party resources, least-privilege workflow permissions, actions pinned to SHAs, lockfile committed, `npm ci` in CI, `.env*` ignored. `gha-security-review` on both workflows. |
| DevOps | CI runs the full quality bar; deploy workflow publishes `main` to Pages. |
| Testing | Vitest and Playwright wired, with a unit test and a smoke e2e test, both run in CI. |
| Accessibility | axe check in the smoke test for both color schemes; focus ring and reduced-motion rules in global CSS. |
| UX | DESIGN-SYSTEM.md tokens wired into `tokens.css`, fonts self-hosted. |
| Performance / SEO | Static output, sitemap, robots, canonical URL in place from day one. |

## Done when
- `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` and
  `npm run build` all pass locally from a clean clone.
- `npm run preview` serves the placeholder page at `http://localhost:4321/mndx-site/` with the Overpass font,
  correct colors in light and dark mode, and no console errors.
- `ci.yml` and `deploy.yml` pass `gha-security-review` with no high findings.
- No file in `docs/`, `CLAUDE.md` or `CHANGELOG.md` was changed by the generator.
