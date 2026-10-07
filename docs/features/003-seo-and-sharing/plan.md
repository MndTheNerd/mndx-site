# 003-seo-and-sharing — Plan

> **Status:** APPROVED by autopilot · 2026-10-07
> Implements: [spec.md](spec.md)

## Approach
All metadata is rendered at build time by `src/layouts/Base.astro` from typed constants. There is no runtime
code.

- **Shared strings:** `src/content/site.ts` gains an `seo` object (`title`, `description`, `headline`,
  `imageAlt`) and `themeColors` (`light`, `dark`). `Hero.astro` reads the headline from it instead of a
  literal, so the page, the metadata and the image can't drift apart.
- **URLs:** `Base.astro` computes the canonical URL as `new URL(withBase(''), Astro.site)` and the image URL as
  `new URL(withBase('og.png'), Astro.site)`. This uses the base-path helper CLAUDE.md requires, and both follow
  `astro.config.mjs`.
- **theme-color:** `themeColors` in `site.ts` is a deliberate copy of the `--board` hex values. Head metadata
  can't use CSS variables. `seo.spec.ts` asserts the copy equals `tokens.css`, so it can't drift.
- **Structured data:** a pure module `src/lib/structured-data.ts` has two functions:
  - `softwareApplication(canonicalUrl)` returns the typed JSON-LD object
  - `serializeJsonLd(data)` runs `JSON.stringify` and replaces every less-than sign with the six-character
    JSON escape: backslash, `u`, `0`, `0`, `3`, `c`

  `Base.astro` renders `<script type="application/ld+json" set:html={...} />`. Astro leaves typed scripts
  unprocessed, and browsers never execute an `application/ld+json` block, so the CSP doesn't apply to it. That
  is proven by the zero-console-error fixture.
- **Preview image:** `scripts/og/` holds three files:
  - `template.html`, a 1200×630 card laid out with tokens and inlined fonts
  - `inputs.ts`, which builds the HTML from the template, `tokens.css`, the self-hosted Overpass WOFF2 files
    (as data URLs) and the `seo` constants, and computes the inputs' SHA-256
  - `generate.ts`, which renders the HTML in Playwright's Chromium and screenshots it to `public/og.png`, then
    writes the hash to `scripts/og/inputs.sha256`. For a deterministic render it uses viewport 1200×630,
    `deviceScaleFactor: 1`, `emulateMedia({ colorScheme: 'light' })`, and awaits `document.fonts.ready`
    before the screenshot. Its header comment says to run `npm run format` first (formatting changes hashed
    files) and `npx playwright install chromium` once per machine.

  The hash is the SHA-256 of `cardHtml()`'s output plus the source of `inputs.ts` and `generate.ts`, all
  LF-normalized UTF-8. `cardHtml()` already contains the template, the tokens, the font bytes (so a
  `@fontsource` upgrade changes it) and the headline. That covers everything that affects the pixels, a
  superset of the spec's list, and excludes the alt text.

  It runs with `npm run og` (`node scripts/og/generate.ts`, using Node's built-in TypeScript type stripping).
  Since it runs by hand, CI never needs a browser for the build.
- **Crawl files:** delete `public/robots.txt`. The sitemap integration is already in place.
- **CSP:** in `astro.config.mjs`, `connect-src 'none'` becomes `connect-src 'self'` (spec NFR-2). Lighthouse
  fetches `/robots.txt` from inside the page, and `'none'` blocks that. Proven at verify: SEO went from 92 to
  100 on an otherwise identical build.

Alternatives rejected:
- An Astro page or endpoint for the card would ship to `dist/` and the sitemap.
- `@vercel/og` / satori adds a dependency for one image.
- A hand-made PNG couldn't be reproduced, and could drift from the headline.

## Changes
### Data model
None at runtime.
```ts
// src/content/site.ts (added)
export const seo: { title: string; description: string; headline: string; imageAlt: string };
export const themeColors: { light: string; dark: string }; // equal to --board in tokens.css (tested)
// src/lib/structured-data.ts
export function softwareApplication(canonicalUrl: string): SoftwareApplication;
export function serializeJsonLd(data: unknown): string;
// scripts/og/inputs.ts
export function cardHtml(): string;      // template + tokens + font data URLs + seo.headline (only constant used)
export function inputsHash(): string;    // sha256 of cardHtml() + inputs.ts + generate.ts sources, LF-normalized
```

### Interfaces
- New `<head>` tags in `Base.astro`, listed in spec AC1 and AC2, plus JSON-LD (AC4).
- `npm run og` regenerates `public/og.png` and `scripts/og/inputs.sha256`.

### Files
| File | Change |
|---|---|
| `src/content/site.ts` | modified: add `seo` and `themeColors` |
| `src/lib/structured-data.ts` | new: JSON-LD object and safe serializer |
| `src/layouts/Base.astro` | modified: robots, theme-color, Open Graph, Twitter, JSON-LD; title and description come from `seo` by default |
| `src/pages/index.astro` | modified: stop passing literal title and description (use `seo`) |
| `src/components/Hero.astro` | modified: headline from `seo.headline` |
| `public/robots.txt` | deleted |
| `astro.config.mjs` | modified: `connect-src 'self'` |
| `public/og.png` | new: generated preview image |
| `scripts/og/template.html`, `scripts/og/inputs.ts`, `scripts/og/generate.ts`, `scripts/og/inputs.sha256` | new: generator and its input hash |
| `package.json` | modified: `"og": "node scripts/og/generate.ts"` |
| `tests/unit/structured-data.test.ts` | new: AC4 object, NFR-2 escaping |
| `tests/unit/og-image.test.ts` | new: AC3 (PNG signature, IHDR 1200×630, ≤ 300 KB, inputs hash matches) |
| `tests/e2e/seo.spec.ts` | new: AC1, AC2, AC4 rendered, AC5 |
| `tests/e2e/budget.spec.ts` | modified: a new navigating test (`page.on('request')` before `goto`, wait for `load`) asserts no request for `og.png` (AC6); `type="application/ld+json"` blocks are excluded from `jsBytes` (they're data, not JS) but still counted in the HTML total |
| `tests/unit/source-rules.test.ts` | modified: `set:html` allowed only in `src/layouts/Base.astro`, and only as `set:html={serializeJsonLd(` |
| `src/content/site.ts` | also: a comment that it must stay import-free (or use `.ts` specifiers), because `npm run og` loads it with Node type stripping |
| `docs/ARCHITECTURE.md` | modified at ship: drop `robots.txt`, add `scripts/og/` and the metadata flow |

## Tasks
- [x] T1 `structured-data.ts` with `structured-data.test.ts`: write the escaping test (red), then the
      serializer; write the object test (red), then `softwareApplication`. (AC4, NFR-2)
- [x] T2 Add `seo` and `themeColors` to `site.ts`. Hero reads `seo.headline`. 002's tests still pass. (AC6)
- [x] T3 Write `seo.spec.ts` for AC1, AC2, AC4 rendered and AC5 (red), then the `Base.astro` head tags and the
      JSON-LD, the `index.astro` change, and the deletion of `public/robots.txt` (green).
- [x] T4 `scripts/og/` generator and `npm run og`. Write `og-image.test.ts` (red), run `npm run format` and then
      `npm run og` (green). Add the AC6 navigating test and the JSON-LD exclusion to `budget.spec.ts`, plus the
      `set:html` rule to `source-rules.test.ts`. (AC3, AC6, NFR-2)
- [x] T5 Full quality bar. At verify: Lighthouse, the AC3 visual review (full size and 400 px), and the AC4
      claim audit (every JSON-LD claim backed by the page or the repo).

## Test plan
| AC | Test (type · location) |
|---|---|
| AC1 | e2e · `seo.spec.ts`: counts of each tag; title 30–60 characters and starts with "MNDX"; description 110–160 characters and mentions "Claude Code"; canonical = `site` + `base` (read from `astro.config.mjs` via import); robots content; two theme-color tags with their media queries, values equal (case-insensitive) to the `--board` values parsed from `src/styles/tokens.css` |
| AC2 | e2e · `seo.spec.ts`: every `og:*` value; `og:image` = canonical + `og.png`; type, width, height and alt; `twitter:card`; each `twitter:*` equal to its `og:` counterpart; no `twitter:image` |
| AC3 | unit · `og-image.test.ts`: the PNG signature; width and height read from the IHDR chunk = 1200×630; size ≤ 300 KB; `inputsHash()` equals `scripts/og/inputs.sha256`. Verify: a visual review at full and 400 px size |
| AC4 | unit · `structured-data.test.ts`: the exact object (literal expected values from the spec). e2e · `seo.spec.ts`: exactly one `application/ld+json` block, which parses and deep-equals the expected object for the canonical URL |
| AC5 | e2e · `seo.spec.ts` (reads `dist/`): `sitemap-index.xml` references `sitemap-0.xml`, whose only `<loc>` is the canonical URL; `link rel="sitemap"` present; `dist/robots.txt` absent |
| AC6 | e2e · all existing specs unchanged; `budget.spec.ts` passes and also asserts that page load makes no request whose URL ends in `og.png` |
| NFR-1 | verify · Lighthouse against `astro preview`, every category ≥ 95, no exceptions; deployed URL in 004 |
| NFR-2 | unit · `structured-data.test.ts`: a value containing `</script>` serializes with no `</`, and parses back to the same value. e2e · CSP test (002); `seo.spec.ts` splits the CSP on `;` and asserts the full directive set (non-hash parts) equals the expected list, with `connect-src` exactly `'self'`; console-error fixture |
| NFR-3 | unit · `og-image.test.ts` size; e2e · `budget.spec.ts` |

## Concern coverage
| Concern | Design decision | Proven by |
|---|---|---|
| Testing | Pure serializer and data module; e2e on the built head; file checks on the PNG | test plan |
| Security | Typed constants only, `<` escaped, a non-executed data block. The CSP stays same-origin, and only `connect-src` widens from `'none'` to `'self'` (for the Lighthouse robots fetch): `default-src 'self'`, no `unsafe-*`, no other origins. The `astro.config.mjs` comment explains why, so it isn't reverted | `structured-data.test.ts`, CSP test, exact-directive test in `seo.spec.ts`, console fixture, semgrep |
| SEO | Full head set from one source; sitemap kept; ineffective robots.txt removed | `seo.spec.ts`, Lighthouse |
| Product & UX | The card uses the tokens, fonts and headline constant | `og-image.test.ts` hash, visual review |
| Accessibility | Alt text constant used for both alt tags; theme-color equals tokens | `seo.spec.ts` |
| DevOps | A hand-run generator with an input-hash guard | `og-image.test.ts` |
| Performance | The page never requests `og.png` | `budget.spec.ts` |

## Risks & mitigations
- **Node type stripping:** it's unflagged from Node 22.18, and this machine and CI use Node 24. `npm run og`
  is documented as needing Node ≥ 22.18. The site build itself keeps `engines >=22.12.0`. Type stripping
  rejects enums and parameter properties, and `strictest` doesn't set `erasableSyntaxOnly`, so `scripts/og/`
  avoids that syntax by rule (stated in its header). The scripts import with explicit `.ts` extensions, which
  Astro's base tsconfig allows (`allowImportingTsExtensions`). `site.ts` stays import-free (commented).
- **`set:html` on the JSON-LD script:** the value is our own escaped serializer output, rendered server-side.
  A new source rule limits `set:html` to that one call.
- **Font rasterization differs by OS:** the image isn't byte-compared, only its dimensions, size and the
  input hash.

## Decisions
- No ADR needed. Everything is build-time metadata within ADR 0001.
