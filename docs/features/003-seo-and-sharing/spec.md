# 003-seo-and-sharing — SEO and sharing

> **Status:** APPROVED by autopilot · 2026-10-07
> Kind: feature · Created: 2026-10-07
> Amended 2026-10-07 at verify: `connect-src 'self'` (NFR-2).

## Problem
Most visitors will reach the page through a shared link (X, Reddit, Hacker News, Discord) or a search. Today a
shared link has no preview card, so it shows a bare URL. Search engines get no structured description of
MNDX, and the page ships a `robots.txt` at `/mndx-site/robots.txt` that crawlers never read (they only read
`robots.txt` at the domain root). This item makes the page preview well when shared and gives search
engines accurate, valid metadata. It covers PRODUCT.md v1 scope line 6.

## Concerns
| Concern | Why it applies | Checklist · skills | Adds to this item |
|---|---|---|---|
| Testing | always | testing.md · tdd | Every AC has a Vitest or Playwright test against the built page or the committed files. Lighthouse (NFR-1) and the claim audit (AC4) are verify-only. |
| Security | always | security.md · security-and-hardening | The CSP stays same-origin; only `connect-src` widens from `'none'` to `'self'` (NFR-2). The JSON-LD is a non-executed data block, serialized from typed constants with `<` escaped (NFR-2). Metadata contains no secrets. |
| SEO | the point of the item | seo | Title, description, canonical, robots meta, Open Graph, Twitter card, JSON-LD, sitemap (AC1–AC5) |
| Product & UX | the share card is the first impression | ux.md · frontend-design | The preview image uses DESIGN-SYSTEM.md tokens and type, and the headline from the shared content constant (AC3). Legibility at card size is a verify-only review. |
| Accessibility | metadata that users meet | accessibility.md | `og:image:alt` and `twitter:image:alt` from one constant (AC2). `theme-color` taken from the `--board` token in both schemes (AC1). |
| DevOps | the image must stay reproducible | ci-cd-and-automation | A committed generator script (`npm run og`), plus a test that fails when the generator's inputs change without the image being regenerated (AC3) |
| Performance | PRODUCT.md budget | performance-optimization | The page never loads `og.png`. The extra head bytes keep the first load ≤ 100 KB (AC6, NFR-3). |

Dropped: **Infrastructure**. "image" matched, but the image is a static file served by Pages, with no new
infrastructure.

## Users & scenarios
- When I paste the MNDX link into X, Discord or Slack, I want a card with a clear title, a one-line
  description and an image, so that people see what it is before they click.
- When someone searches for a Claude Code workflow plugin, I want the result to show an accurate title and
  description.

## User stories
- As someone sharing MNDX, I want a good preview card, so that the link gets clicked.
- As a searcher, I want a clear result, so that I know it's a free Claude Code plugin before I visit.

## Acceptance criteria
The canonical page URL is the configured `site` + `base` from `astro.config.mjs`
(`https://mndthenerd.github.io/mndx-site/`). Tests derive it from that config, so a later custom domain needs
one change. The shared strings live in `src/content/site.ts`: the title, the description, the headline and
the image alt text. The page, the metadata and the image generator all read them from there.

- **AC1 (head metadata)** Given the built page, then its `<head>` contains exactly one of each of the
  following, except `theme-color`, which appears twice:
  - `<title>`, 30–60 characters, starting with "MNDX"
  - `meta name="description"`, 110–160 characters, mentioning "Claude Code"
  - `link rel="canonical"` with the canonical URL
  - `meta name="robots"` with `index, follow, max-image-preview:large`
  - `meta name="theme-color"`: one for `(prefers-color-scheme: light)` and one for
    `(prefers-color-scheme: dark)`, equal (case-insensitive) to the light and dark `--board` values in
    `src/styles/tokens.css`
- **AC2 (Open Graph and Twitter card)** Given the built page, then it has:
  - `og:type` = `website`
  - `og:site_name` = `MNDX`
  - `og:title` = `<title>`
  - `og:description` = the meta description
  - `og:url` = the canonical URL
  - `og:image` = the canonical URL + `og.png`, an absolute HTTPS URL
  - `og:image:type` = `image/png`, `og:image:width` = `1200`, `og:image:height` = `630`
  - `og:image:alt` = the alt-text constant
  - `twitter:card` = `summary_large_image`
  - `twitter:title`, `twitter:description` and `twitter:image:alt`, each equal to its `og:` counterpart

  `twitter:image` is left out on purpose: X falls back to `og:image`.
- **AC3 (preview image)** Given the repository, then:
  - `public/og.png` is a committed PNG, exactly 1200×630 and ≤ 300 KB
  - it's produced by a generator run by hand with `npm run og`. The generator uses Playwright's Chromium,
    which is already a dev dependency, so nothing new is added. It renders a template with the site's
    self-hosted fonts and `tokens.css`, and shows the wordmark "MNDX", the headline constant, and a
    simplified track with the two `/mndx:approve` signals
  - the generator records a SHA-256 of everything that affects the pixels in `scripts/og/inputs.sha256`:
    the template, the generator scripts, `tokens.css`, the headline, and the pinned `@fontsource/overpass`
    and `@fontsource/overpass-mono` versions. The alt text is left out, because it doesn't change the image.
    The hash is computed over LF-normalized UTF-8 text, so it's the same on Windows and Linux. A Vitest test recomputes that hash and fails if it differs, which means
    an input changed without `npm run og` being re-run

  Byte-identical output across operating systems isn't required, because font rasterization differs.
  Visual quality is a verify-only review: the image at 1200×630 and scaled to a 400 px card.
- **AC4 (structured data)** Given the built page, then it contains exactly one
  `<script type="application/ld+json">` that parses as JSON with:
  - `@context` = `https://schema.org`, `@type` = `SoftwareApplication`
  - `name` = `MNDX`
  - `applicationCategory` = `DeveloperApplication`
  - `operatingSystem` = `Windows, Linux` (the README states its CI runs on Ubuntu and Windows)
  - `description` = the meta description
  - `url` = the canonical URL
  - `sameAs` = `https://github.com/MndTheNerd/mndx`
  - `license` = `https://github.com/MndTheNerd/mndx/blob/main/LICENSE`
  - `offers`: `{ "@type": "Offer", "price": "0", "priceCurrency": "USD" }`
  - `author`: `{ "@type": "Person", "name": "mndthenerd", "url": "https://github.com/MndTheNerd" }`

  No rich result is expected: Google needs ratings or reviews for that, and MNDX has none. Checking that
  every claim is backed by the page or the repo is a verify-only review.
- **AC5 (sitemap and crawl metadata)** Given the build output, then:
  - `sitemap-index.xml` references `sitemap-0.xml`, which lists exactly the canonical URL
  - the page keeps `link rel="sitemap"`
  - `dist/robots.txt` doesn't exist. A `robots.txt` under `/mndx-site/` is never read; only the domain-root
    file counts, and `https://mndthenerd.github.io/robots.txt` returns 404, which allows all crawling. The
    meta robots tag (AC1) controls indexing and snippets.

  Google ignores `link rel="sitemap"`, so the sitemap reaches Google only after it's submitted in Search
  Console. That's a manual post-deploy step (Out of scope).
- **AC6 (no regressions)** Given the whole quality bar, then:
  - all of 002's e2e and unit tests pass unchanged; the content and visual assertions still hold
  - `budget.spec.ts` still passes with the new head tags, and no network request for `og.png` happens during
    page load (asserted)

## Edge cases & errors
- A share scraper that ignores `og:image:alt`: the image still carries the headline as visible text.
- The site moves to a custom domain later: the canonical, `og:url` and `og:image` follow `site` + `base` in
  `astro.config.mjs`, and the tests read the same config.
- Platforms cache share cards. If `og.png` is replaced at the same URL, old previews can persist until the
  platform re-scrapes. This is accepted for v1. Refreshing through the platforms' card debuggers is a manual
  post-deploy step.
- A JSON-LD string containing `</script>`: escaped (NFR-2), so the data block can't be closed early.

## Non-functional requirements
- **NFR-1 (verify-only):** Lighthouse mobile scores ≥ 95 in SEO, Performance, Accessibility and Best
  Practices.
  - Measured on the deployed URL in item 004, where the domain-root `robots.txt` really is a 404.
  - At this item's verify, it's also run against `astro preview`, where the root `/robots.txt` is a 404 just like
    on Pages.
- **NFR-2 (security):** the CSP keeps `default-src 'self'`, no `unsafe-*` and no third-party origins, and there
  are zero console errors. One deliberate change: `connect-src` goes from `'none'` to `'self'`.
  - **Why:** with `'none'`, Lighthouse's in-page fetch of `/robots.txt` is blocked, which caps SEO at 92. This
    was proven at verify: the same build scores 100 with `'self'`.
  - **Risk:** the page makes no network requests from script, and every script is our own hashed bundle. So
    `'self'` only allows same-origin requests that nothing makes. `'self'` here means
    `mndthenerd.github.io`, which covers all of the owner's Pages sites. That's acceptable because the owner
    controls them all. A narrower source isn't possible: CSP host sources can't be relative to a path, and a
    host-qualified `/robots.txt` source would differ between preview and Pages. Real crawlers don't run the
    page's CSP, so this change only affects the Lighthouse measurement. That measurement is a PRODUCT.md
    success criterion (SEO ≥ 95).
  - **Tested:** an e2e test asserts the exact policy: every directive is listed, and `connect-src` is exactly
    `'self'`. Any future widening fails it.
  - **JSON-LD escaping:** the JSON-LD is serialized with `JSON.stringify` from typed constants, and every `<`
    in the output is replaced by the six characters backslash, `u`, `0`, `0`, `3`, `c`. A unit test feeds a
    value containing `</script>` through the serializer and asserts the output contains no `</`.
- **NFR-3:** `og.png` ≤ 300 KB. The page's first load stays ≤ 100 KB, because `og.png` isn't requested by the page.

## Out of scope
- A custom domain, Search Console setup, submitting the sitemap, and refreshing share caches. These are manual
  steps after deploy, listed in the report.
- `llms.txt`, WebMCP, hreflang, and AI-crawler-specific robots rules.
- Per-platform image variants (square images, etc.).

## Open questions
- None. Assumptions under autopilot:
  - The author is shown as the GitHub handle `mndthenerd`, which already appears publicly in the repo's
    license and plugin manifest.
  - `docs/ARCHITECTURE.md` drops `robots.txt` and gains the `og` generator at ship.
