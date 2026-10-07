# ADR 0001: Astro static site on GitHub Pages

> Status: Accepted · Date: 2026-10-07

## Context
The product is one public, content-heavy landing page. What matters is time-to-first-read on phones, SEO and
share previews, and zero running cost. It needs almost no interactivity (copy buttons, one hero animation),
no server, no data and no accounts. The user wants it deployed on GitHub. The MNDX web playbook defaults to
Next.js and lists Astro as the alternative for content sites. pnpm is not installed on this machine.

## Options considered
| Option | Pros | Cons |
|---|---|---|
| **Astro 7 + TS strict + plain CSS tokens** | Built for content sites; zero JS by default; static output drops straight onto Pages; components keep sections tidy; first-class TypeScript and `astro check` | One more framework to know (small); smaller ecosystem than React |
| Plain HTML/CSS/JS with Vite | Fewest dependencies, nothing to learn | No components or typed content; one large HTML file gets hard to maintain; harder to test content against the README |
| Next.js (static export) | Playbook default; huge ecosystem | Ships the React runtime for no benefit; `next/image` and many features don't work in static export; slower page for the same content |
| Tailwind instead of plain CSS | Fast to write | Extra build dependency; a single page with a small token set doesn't need it; class soup hurts readability of a showcase codebase |
| Vercel / Netlify instead of Pages | Preview deploys, real headers (CSP) | Another account and service; the user asked for GitHub |

## Decision
Astro 7 in static mode with TypeScript strict and plain CSS custom-property tokens, tested with Vitest and
Playwright, linted with ESLint and Prettier, built and deployed to GitHub Pages by GitHub Actions. npm is the
package manager.

## Consequences
- Easier: near-zero JS, excellent Lighthouse scores, free hosting, deploy on push.
- Harder: GitHub Pages can't set HTTP headers, so the CSP is a `<meta>` tag (no `frame-ancestors`, no HSTS
  control) and there are no preview deploys for pull requests.
- The site lives under the `/mndx-site/` base path until a custom domain is added; all internal links must use
  the base-path helper.
- Revisit hosting if we ever need headers, previews or server features.
