# MNDX site — Architecture

> Living document. Updated by /mndx:ship whenever a change affects structure.

## Overview
A static site built by Astro at build time into plain HTML, CSS, fonts and images. There is no server, no
database and no runtime API. The only JavaScript sent to the browser is two small progressive enhancements:
the copy-to-clipboard buttons and the hero walkthrough animation. Without JavaScript the page is complete:
commands are selectable text and the walkthrough renders as a static step list.

```
content (src/content/*.ts, typed)  ─┐
components (src/components/*.astro) ├─► astro build ─► dist/ (HTML, CSS, fonts, og.png, sitemap, robots)
design tokens (src/styles/tokens.css)┘                         │
                                                                ▼
              GitHub Actions on push to main: quality bar ─► upload dist/ ─► GitHub Pages
                                                  https://mndthenerd.github.io/mndx-site/
```

## Stack
| Layer | Choice | ADR |
|---|---|---|
| Framework | Astro 7, static output, TypeScript strict | [0001](adr/0001-stack.md) |
| Styling | Plain CSS with custom-property design tokens, scoped component styles | [0001](adr/0001-stack.md) |
| Fonts | Self-hosted WOFF2 (via Fontsource packages), subset, `font-display: swap` | [0001](adr/0001-stack.md) |
| Client JS | Inline Astro `<script>` modules, no framework | [0001](adr/0001-stack.md) |
| Tests | Vitest (content and helpers), Playwright (page, a11y via axe, copy buttons, no-JS) | [0001](adr/0001-stack.md) |
| Lint/format | ESLint (+ eslint-plugin-astro), Prettier (+ prettier-plugin-astro), `astro check` | [0001](adr/0001-stack.md) |
| Package manager | npm | [0001](adr/0001-stack.md) |
| Hosting | GitHub Pages via the official `actions/deploy-pages` workflow | [0001](adr/0001-stack.md) |

## Directory layout
```
src/
  pages/index.astro        # the one page: assembles sections, nothing else
  layouts/Base.astro       # <head>: meta, OG, canonical, JSON-LD, fonts, theme tokens
  components/              # one .astro file per section (Hero, Changes, Commands, Proof, Limits, Install)
                           # plus primitives (CopyCommand, Walkthrough)
  content/                 # typed data the page renders: commands.ts, features.ts, site.ts (URLs, version)
  lib/                     # small pure helpers (e.g. url building with the base path), unit-tested
  styles/tokens.css        # design tokens: color (light + dark), type scale, spacing, motion
  styles/global.css        # reset, base element styles
public/                    # og.png, favicon.svg, robots.txt
tests/unit/                # Vitest
tests/e2e/                 # Playwright against `astro preview`
.github/workflows/         # ci.yml (quality bar), deploy.yml (Pages)
docs/                      # PRODUCT, ARCHITECTURE, DESIGN-SYSTEM, adr/, BACKLOG, item docs
```

## Key flows
1. **Visit:** browser requests `/mndx-site/` → static HTML with inlined critical CSS → fonts load with swap →
   the walkthrough script starts only if `prefers-reduced-motion` is not `reduce` and the hero is in view.
2. **Copy a command:** user activates a copy button (click, Enter, Space or tap) → `navigator.clipboard.writeText`
   → the button's live region announces "Copied" → reverts after 2 s. If the Clipboard API is unavailable the
   command text is selected so the user can copy it manually.
3. **Ship:** push to `main` → `deploy.yml` calls `ci.yml` (the full quality bar) → only if it passes, builds and
   publishes `dist/` to Pages. A red quality bar never deploys. Pull requests run `ci.yml` only.

## Data model
No runtime data. Content is typed TypeScript modules in `src/content/`:
- `Command { name: string; args?: string; summary: string; userOnly: boolean }`
- `Feature { title: string; body: string; detailUrl?: string }`
- `site { repoUrl, docsUrl, siteUrl, basePath, installCommands: string[], version }`

## Cross-cutting concerns
- **Errors:** build fails on any type error, broken internal link or missing content field. Client scripts
  fail soft (copy falls back to text selection, walkthrough falls back to the static list).
- **Validation:** content modules are typed; a unit test asserts install commands equal the README's.
- **Auth:** none.
- **Config & secrets:** none at runtime. `site` and `base` are set in `astro.config.mjs`. Deploy uses the
  workflow's built-in `GITHUB_TOKEN` with `pages: write` and `id-token: write` only.
- **Logging:** none at runtime. CI logs are the record of every build.
- **Security headers:** GitHub Pages can't set headers, so the page uses a `<meta>` Content-Security-Policy
  (`default-src 'self'`, hashed inline scripts) and loads no third-party resources.

## Conventions
- Sections are `.astro` components with scoped styles; they read content from `src/content/`, never hard-code
  copy that also appears in the README.
- Every color, size, space and duration comes from `tokens.css`. No raw hex values in components.
- All internal URLs go through the base-path helper so the site works under `/mndx-site/` and at a root domain.
- Motion respects `prefers-reduced-motion`; nothing autoplays when it is set.
- Semantic HTML first: landmarks, one `h1`, ordered headings, real `<button>`s.
