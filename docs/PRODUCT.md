# MNDX site — Product

> One-line pitch: a single fast page that shows Claude Code users what MNDX does and gets them to install it in
> two commands.

## Problem
MNDX (github.com/MndTheNerd/mndx) is a Claude Code plugin that makes Claude work like a disciplined product team:
spec and plan approved before code, test-first builds, verification against real commands, shipped with docs.
Today the only way to learn about it is the GitHub README. A README is good reference material, but it can't
*show* the thing that makes MNDX different (Claude being stopped at a gate until you approve), it isn't
something people share, and it ranks poorly for searches like "Claude Code workflow plugin".

## Users
Solo developers and indie hackers who already use Claude Code and have been burned by it: code that was
"done" but untested, features built differently from what they asked, changes nobody wrote down. They arrive
from a shared link (X, Reddit, Hacker News, a Discord) or a search, usually on a phone first, and decide within
a minute whether it's worth installing.

## Goals
1. A visitor understands within one screen what MNDX is and what changes when they use it.
2. A convinced visitor can copy both install commands without leaving the page.
3. The page is credible to skeptical developers: it shows real commands, real proof and honest limits, not
   marketing claims.
4. The page is cheap to keep accurate: content mirrors the README and links to the GitHub docs for depth.

## Non-goals
- A documentation site. Depth stays in the repo's `docs/` and the page links to it.
- Accounts, forms, newsletter, waitlist, comments.
- Analytics, cookies or any tracking.
- Translations or right-to-left layouts.
- A manual light/dark switch (the page follows the system setting).

## Success criteria
- Lighthouse (mobile) ≥ 95 in Performance, Accessibility, Best Practices and SEO on the deployed page.
- Every install command on the page matches the README exactly, and the copy buttons work with mouse,
  keyboard and touch.
- Zero JavaScript errors in the console; the page is fully readable with JavaScript disabled.
- Live at a public GitHub Pages URL, deployed automatically from `main`.
- Interest is measured outside the site: GitHub stars and repo traffic on MndTheNerd/mndx.

## Production concerns
| Concern | Why it applies to this product | ⚖ Needs a human decision |
|---|---|---|
| Security | always. Static site, no inputs or secrets, but third-party scripts, the deploy workflow and dependency supply chain still matter. Strict no-third-party-scripts rule. | — |
| Testing | always. Content correctness (commands match the README), copy buttons, links, no console errors | — |
| Product & UX design | the page *is* the product; it has to make the gate idea clear in seconds | — |
| Accessibility | public page; WCAG 2.2 AA, keyboard, reduced motion, contrast in both themes | — |
| Web frontend | static Astro site, responsive from 320 px | — |
| SEO | discoverability is the point: title/description, Open Graph image, canonical URL, sitemap, robots, JSON-LD `SoftwareApplication` | — |
| Performance | shared links open on phones; budget ≤ 100 KB transferred on first load, LCP < 2.0 s on mid mobile | — |
| DevOps | GitHub Actions runs the quality bar on every push and deploys `main` to GitHub Pages | — |
| Privacy & compliance | does not apply in v1: no personal data, cookies or analytics. Fonts are self-hosted so no visitor IP goes to a font CDN. Revisit if analytics are ever added. | Adding analytics later needs a privacy note. |

Not applicable: auth, payments, data storage, i18n, messaging, AI, app-store, infra beyond Pages.

## Markets
Global, English only. Left-to-right only. No content aimed at minors; general developer audience.

## Scope of v1
- [x] Landing page: hero with an animated walkthrough of the pipeline and the approval gate
      (spec → approve → plan → approve → build → verify → ship), readable as static content without JS
- [x] "What changes" section: hard gate, verified shipping, concern router, independent reviewers,
      existing projects, autopilot
- [x] Command reference for all `/mndx:*` commands
- [x] Proof and honest limits sections (dogfooding results, what MNDX doesn't do)
- [x] Install section with copy buttons and links to the GitHub repo and docs
- [x] SEO and sharing: metadata, Open Graph image, sitemap, robots, structured data
- [ ] Deploy to GitHub Pages from a public `MndTheNerd/mndx-site` repo

## Later
- Custom domain.
- Cookieless analytics (Plausible or GoatCounter) plus a short privacy note.
- A short screen recording of a real MNDX session.
- Pull the command table and version number from the mndx repo at build time so they never drift.
  For now, `tests/fixtures/mndx-readme.md` is a pinned snapshot that is refreshed by hand.
- A CSS fallback that shows the diagram's final state if the walkthrough script never starts.

## Assumptions
Recorded from the init interview: the user answered the hosting question ("deploy it on GitHub") and the repo
question (MndTheNerd/mndx is public). Every other answer below is the recommended default, accepted by default
and open to change before this doc is approved.
- Audience is solo developers and indie hackers already using Claude Code; the main action is copying the
  install commands, the secondary is opening or starring the repo.
- v1 is one long landing page; docs, blog, newsletter, translations and a theme switch are out.
- No analytics, cookies or forms in v1.
- Hosting is GitHub Pages from a new public repo `MndTheNerd/mndx-site`, served at
  `https://mndthenerd.github.io/mndx-site/`. No custom domain yet. $0/month.
- Stack is Astro + TypeScript strict + plain CSS with tokens (ADR 0001); npm instead of pnpm because pnpm
  isn't installed on this machine.
- No hard deadline. Lighthouse ≥ 95 on mobile is the bar.
- The mndx README's note that "the repo is private" is now stale. Fixing it belongs to the mndx repo, not this
  project.
- Pushing to GitHub and enabling Pages happen at release (`/mndx:release … deploy`), which the user has asked
  for.
