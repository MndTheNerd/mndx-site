# Changelog

All notable changes are recorded here by `/mndx:ship`.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.0] - 2026-10-07

### Added
- Search and sharing ([003-seo-and-sharing](docs/features/003-seo-and-sharing/)):
  - a share card (1200×630) for X, Slack and Discord, generated with `npm run og`
  - Open Graph and Twitter tags
  - schema.org `SoftwareApplication` data
  - robots and theme-color meta

  Lighthouse mobile scores 100 in all four categories.
- The landing page ([002-landing-page](docs/features/002-landing-page/)):
  - a hero with the headline, the two install commands and copy buttons
  - a signal-box track diagram that walks a change through spec, plan, build, verify and ship, stopping at
    both `/mndx:approve` signals
  - the eight things that change with MNDX, the full command reference, the dogfooding proof, honest limits,
    and the install steps

  It works without JavaScript, respects reduced motion, has no WCAG 2.2 AA violations in light and dark mode,
  and loads in about 74 KB. Its content is tested against a snapshot of the MNDX README.
- Project skeleton: a static Astro 7 site served under `/mndx-site/`, with self-hosted Overpass fonts, the
  design-system tokens in light and dark mode, and a same-origin Content Security Policy.
  ([001-project-setup](docs/chores/001-project-setup/))
- Quality bar: Prettier, ESLint, `astro check`, Vitest, and Playwright with an axe WCAG 2.2 AA check in both
  color schemes.
- CI for pull requests and a GitHub Pages deploy workflow that only publishes when the full quality bar passes.

### Removed
- `robots.txt` under `/mndx-site/`. Crawlers only read it at the domain root.
