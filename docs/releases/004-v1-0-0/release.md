# 004-v1-0-0 — Release

> **Status:** APPROVED by autopilot · 2026-10-07
> Version: 1.0.0
> Kind: release · Created: 2026-10-07

## What's in it
The first public version of the MNDX site:
- **The landing page:** the gate headline, the install commands with copy buttons, the signal-box walkthrough
  of spec → approve → plan → approve → build → verify → ship, what changes, all 16 commands, proof, limits and
  install steps.
- **Search and sharing:** a 1200×630 share card, Open Graph and Twitter tags, schema.org data and a sitemap.
- **The foundation:** a static Astro site, a strict same-origin CSP, a full quality bar in CI, and a Pages
  deploy gated on that quality bar.

## Version reasoning
1.0.0: the first stable release. Nothing has been released before, so no entry is breaking for users. All of
PRODUCT.md's v1 scope is done except "Deploy to GitHub Pages", which this release does (that line is ticked at
ship).

## Readiness
- [x] Every item since the last release is shipped: 001, 002 and 003 shipped, no active item; BACKLOG lines 1–3
      are done, and line 4 is this release.
- [x] `mndx.js check` was green after 003's last change: format, lint, typecheck, 36 unit, 57 e2e, build. It
      runs again (Steps 4) after the release edits.
- [x] Migrations: n/a. It's a static site with no data store.
- [x] Config and secrets for the target environment: none needed. Deploy uses the workflow's built-in
      `GITHUB_TOKEN` (`pages: write`, `id-token: write` on the deploy job). Pages source = GitHub Actions is
      set by the RUNBOOK.
- [x] Error tracking and health check: n/a for a static page with no runtime. The RUNBOOK smoke check is the
      health check. Analytics are deliberately absent (PRODUCT.md).
- [x] Going public, accepted assumptions:
  - The commit author `mndthenerd <mndthenerd@gmail.com>` becomes public in this repo's history. The same
    address is already public in the commits of the public `MndTheNerd/mndx` repo, so a GH007
    email-privacy rejection isn't expected.
  - The site's code has no LICENSE (`"license": "UNLICENSED"`, all rights reserved), pending the owner's ⚖
    decision.

## Steps
- [x] 1. `deploy.yml`: remove the `actions/configure-pages` step. Its outputs are unused, because `base` is set
      in `astro.config.mjs`. It would also call the Pages API with only `contents: read` and could fail the
      first run. The `build` job keeps `contents: read`.
- [x] 2. Version bumped in `package.json` (0.0.0 → 1.0.0)
- [x] 3. CHANGELOG: `[Unreleased]` → `[1.0.0] - 2026-10-07`, with a fresh empty `[Unreleased]` above it.
      PRODUCT.md's deploy scope line is ticked.
- [x] 4. `mndx.js check` green on this exact code, then `mndx.js stage ship` and `mndx.js done`
- [x] 5. Commit `chore(release): v1.0.0`, then the annotated tag `git tag -a v1.0.0 -m "v1.0.0"` (annotated,
      so `--follow-tags` pushes it)
- [ ] 6. Deploy (below)
- [ ] 7. Record the deploy result in this file's **Deploy result**, commit it as `docs(release): v1.0.0 deploy
      result`, and push. That re-runs the gated deploy with an identical site, which is harmless and
      confirms the second-run path.

## Deploy
The user asked for it directly, three times in this session: "deploy it on github", then "just get it to
work on github please", then the autopilot goal "have the website live". So this release deploys, using
[docs/RUNBOOK.md](../../RUNBOOK.md) **First deploy**:
1. `gh repo create MndTheNerd/mndx-site --public …` (`gh` is authenticated as MndTheNerd with the `repo` and
   `workflow` scopes; the repo doesn't exist yet; checked)
2. `git remote add origin https://github.com/MndTheNerd/mndx-site.git`
3. `gh api -X POST repos/MndTheNerd/mndx-site/pages -f build_type=workflow`. If it fails on the empty repo, use
   the RUNBOOK fallback: push first, then enable Pages, then `gh workflow run deploy.yml --ref main`. Either
   way, confirm with `gh api repos/MndTheNerd/mndx-site/pages --jq .build_type` → `workflow`.
4. `git push -u origin main --follow-tags`
5. Find the run for the pushed commit (`gh run list … --json databaseId,headSha`, polled until `headSha`
   matches), then `gh run watch <id> --exit-status`.
6. The RUNBOOK smoke check, with retries for up to 5 minutes after the run goes green.

**Known risk:** the workflows have never run on GitHub, so this first run is their integration test. If it
fails, nothing is live: fix forward and re-push.

## Deploy result
**Live:** https://mndthenerd.github.io/mndx-site/ (deployed 2026-10-07).

- **First attempt failed, nothing was published.** The first deploy run (37614814559) was for `v1.0.0`
  (`9d8e628`). Its quality bar failed at `copy.spec.ts:72`: a timing race in an e2e test, not a site defect.
  The gate skipped build and deploy, as designed.
- **Deployed commit:** `73af3c7`, the fix for that test (item 005, test-only). Deploy run **37637331398**:
  quality-bar, build and deploy all succeeded.
- **Tag:** `v1.0.0` deliberately stays on `9d8e628`, whose site code is identical to what's live. Only test
  code changed between the tag and the deployed commit.
- **Smoke check (RUNBOOK), all passed:** page 200 with the exact headline; stylesheet
  `/mndx-site/_astro/index.CN1EvrKI.css` and `overpass-latin-400-normal.BpeLJ0bs.woff2` both 200; `og.png`
  200 as `image/png` (39,278 bytes); `sitemap-index.xml` 200; in a real browser the copy buttons are visible,
  the walkthrough finishes, and there are 0 console errors and 0 CSP violations.
- **Lighthouse mobile on the live URL:** Performance 100, Accessibility 100, Best Practices 100, SEO 100;
  LCP 1.2 s, CLS 0.039.

## Rollback
- **First deploy fails:** nothing is live. Fix forward, then re-push (or re-run with
  `gh workflow run deploy.yml`).
- **Live but wrong** (fails the smoke check): if it's misleading, take it down with
  `gh api -X DELETE repos/MndTheNerd/mndx-site/pages` (the repo and tag stay). Then fix forward:
  re-enable Pages with the RUNBOOK `POST …/pages` command and push the fix.
- **Later releases:** `git revert` the bad commit and push, and the gated pipeline redeploys. Re-running an
  older deploy run is possible within 30 days, but it re-runs the whole quality bar too.
