# 007-add-google-search-console-verification — Chore: add Google Search Console verification file

> **Status:** APPROVED by you · 2026-10-07
> Kind: chore · Created: 2026-10-07

## What & why
The owner is adding `https://mndthenerd.github.io/mndx-site/` to Google Search Console (URL-prefix property) so
they can submit the sitemap. Google verifies ownership by fetching an HTML file from the property's root:
`https://mndthenerd.github.io/mndx-site/google8cec30e54942f93e.html`. The owner downloaded it, and it contains
exactly `google-site-verification: google8cec30e54942f93e.html` (53 bytes, no trailing newline). It goes in
`public/`, which Astro copies to the site root as-is. The file must stay in place, because removing it
un-verifies the property.

## Steps
- [ ] Copy `C:\Users\Mahmoud\Downloads\google8cec30e54942f93e.html` to `public/google8cec30e54942f93e.html`
      byte for byte (copy the file, don't retype it).
- [ ] `.prettierignore`: add `public/google*.html`, so Prettier never reformats the verification file (Google
      checks the exact text).
- [ ] `CHANGELOG.md`: an entry under `[Unreleased]` → Added, saying what the file is and not to delete it.
- [ ] `docs/RUNBOOK.md` (a doc): under "After the first deploy", note that `public/google8cec30e54942f93e.html`
      is the Search Console verification file and must not be removed.
- [ ] Not changed: the sitemap. Astro's sitemap lists only the page, and the verification file isn't a page.

## Concerns
| Concern | What this chore does about it |
|---|---|
| Security | The file is a static, public token with no secrets. It's meant to be public. CSP is unaffected, because a plain document request needs no new origin. Nothing executes. |
| SEO | It enables ownership verification and the sitemap submission. It doesn't add a page: the sitemap and the canonical URL are unchanged. |
| Testing | No behavior changes. The quality bar must stay green: `format:check` (the new ignore rule), `build`, and the existing e2e tests, which don't enumerate `public/`. |
| DevOps | The deploy publishes `dist/`, which will contain the file, so it's served at the root of `/mndx-site/`. The smoke check below proves it. |

## Done when
- `public/google8cec30e54942f93e.html` is byte-identical to the downloaded file (53 bytes, same SHA-256).
- `mndx.js check` is green.
- After the push and the deploy, `https://mndthenerd.github.io/mndx-site/google8cec30e54942f93e.html` returns
  200 with exactly that content, which is what Google fetches when the owner clicks **Verify**.
