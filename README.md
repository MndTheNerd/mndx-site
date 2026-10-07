# MNDX site

The landing page for [MNDX](https://github.com/MndTheNerd/mndx), the Claude Code plugin that makes Claude build
software the way a good product team does.

Live at **https://mndthenerd.github.io/mndx-site/** once deployed.

It's a static [Astro](https://astro.build) site with no server, no trackers and no third-party requests. The
product, architecture and design decisions live in [`docs/`](docs/), and the site itself is built with MNDX.

## Develop

You need Node.js 22.12 or newer.

```bash
npm ci
npm run dev
```

## Quality bar

Every change must pass these before it ships (CI runs them on every push and pull request):

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm run test:e2e` builds the site and tests the production output in Chromium, including an axe accessibility
check in light and dark mode. Run `npx playwright install chromium` once first.

## Deploy

Every push to `main` builds the site and publishes `dist/` to GitHub Pages through
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). In the repo settings, Pages must use
**GitHub Actions** as its source.

## License

No license has been chosen yet, so all rights are reserved for now.
