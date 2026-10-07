# Changelog

All notable changes are recorded here by `/mndx:ship`.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Project skeleton: a static Astro 7 site served under `/mndx-site/`, with self-hosted Overpass fonts, the
  design-system tokens in light and dark mode, and a same-origin Content Security Policy.
  ([001-project-setup](docs/chores/001-project-setup/))
- Quality bar: Prettier, ESLint, `astro check`, Vitest, and Playwright with an axe WCAG 2.2 AA check in both
  color schemes.
- CI for pull requests and a GitHub Pages deploy workflow that only publishes when the full quality bar passes.
