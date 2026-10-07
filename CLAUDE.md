# MNDX site

This project uses **MNDX**. Every change goes through Spec → Plan → Build → Verify → Ship.
Code files can only be edited while the active work item is approved (the gate hook enforces it).
Run `/mndx:status` to see where things stand.

The product is the public landing page for the MNDX Claude Code plugin (github.com/MndTheNerd/mndx).

## Read first
- [docs/PRODUCT.md](docs/PRODUCT.md): what we're building and why
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how it's built
- [docs/adr/](docs/adr/): decisions and their reasons
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md): tokens and visual rules (created by the setup chore)

## Quality bar
These exact commands must pass before anything ships:

| Check | Command |
|---|---|
| Install | `npm ci` |
| Format | `npm run format:check` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Test | `npm test` |
| E2E | `npm run test:e2e` |
| Build | `npm run build` |
| Run (dev) | `npm run dev` |

## Conventions
- Page copy that also exists in the mndx README (install commands, command list) lives in `src/content/` and
  is checked against the README by a unit test.
- Every color, size, space and duration comes from `src/styles/tokens.css`.
- Internal URLs go through the base-path helper in `src/lib/`.
- No third-party scripts, fonts or trackers. Everything is self-hosted.
- Motion respects `prefers-reduced-motion`. The page must read fully with JavaScript off.
- E2E tests run against the production build (`astro preview` on port 4329), never the dev server. Run
  `npx playwright install chromium` once per machine and after upgrading `@playwright/test`.
- Unit tests that touch `withBase` stub `BASE_URL` with `vi.stubEnv`, because Vitest doesn't apply Astro's `base`.
- Packages are pinned to exact versions. TypeScript stays on 6.0.x until `@astrojs/check` and
  `typescript-eslint` support 7.

## Never
- Write files through shell redirects or scripts to get around the MNDX gate.
- Commit secrets, `.env` files, or credentials.
- Push to a remote, deploy, or run destructive migrations without the user asking.
