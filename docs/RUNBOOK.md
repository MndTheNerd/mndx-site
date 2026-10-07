# Runbook

How the MNDX site is deployed, checked and rolled back. Hosting: GitHub Pages (project site) from
`MndTheNerd/mndx-site`, built and published by `.github/workflows/deploy.yml`. That workflow runs the full
quality bar (`ci.yml`) first and publishes only if it passes.

## First deploy (one time)
The repo doesn't exist until the first release. Commit and annotate-tag the release first (`git tag -a`, so
`--follow-tags` pushes it).

```bash
gh repo create MndTheNerd/mndx-site --public --description "Landing page for MNDX, a solo product team inside Claude Code" --homepage "https://mndthenerd.github.io/mndx-site/"
```
```bash
git remote add origin https://github.com/MndTheNerd/mndx-site.git
```
Enable Pages with the GitHub Actions source. This also creates the `github-pages` environment, which only
allows the default branch:
```bash
gh api -X POST repos/MndTheNerd/mndx-site/pages -f build_type=workflow
```
```bash
git push -u origin main --follow-tags
```
**Fallback**, if enabling Pages fails on the empty repo: push first, then run the `gh api` command above, then
start the deploy by hand:
```bash
gh workflow run deploy.yml --repo MndTheNerd/mndx-site --ref main
```
Either way, confirm it. The command should print `workflow`:
```bash
gh api repos/MndTheNerd/mndx-site/pages --jq .build_type
```

## Every later deploy
```bash
git push origin main --follow-tags
```

## Watch the run
Find the deploy run for the commit you pushed. It can take a few seconds to appear, so repeat until `headSha`
equals `git rev-parse HEAD`:
```bash
gh run list --repo MndTheNerd/mndx-site --workflow deploy.yml --branch main --limit 1 --json databaseId,headSha,status
```
```bash
gh run watch <databaseId> --repo MndTheNerd/mndx-site --exit-status
```

## Smoke check (after every deploy)
A first Pages publish can take a few minutes to start serving. Retry each check for up to 5 minutes.
1. `https://mndthenerd.github.io/mndx-site/` returns 200, and its `<h1>` is exactly
   "Claude doesn't write code until you say go."
2. The page's stylesheet (`/mndx-site/_astro/*.css`) and an Overpass `.woff2` it references both return 200.
3. `https://mndthenerd.github.io/mndx-site/og.png` returns 200 with `image/png`.
4. `https://mndthenerd.github.io/mndx-site/sitemap-index.xml` returns 200.
5. In a real browser (a small Playwright script against the live URL), check that:
   - there are no `console` errors and no `securitypolicyviolation` events
   - the copy buttons are visible
   - the walkthrough's figure reaches `data-state="playing"` or `"final"`
6. Lighthouse mobile scores Performance, Accessibility, Best Practices and SEO all ≥ 95. Re-run once if
   Performance dips from network variance. Read `.categories.*.score` from the JSON:
   ```bash
   npx lighthouse https://mndthenerd.github.io/mndx-site/ --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.scratch/lh-live.json --quiet --chrome-flags="--headless=new"
   ```

## Rollback
- **A deploy run fails:** nothing new is live, and Pages keeps serving the last good deploy (on the very first
  deploy, nothing at all). Fix forward and push.
- **Live but wrong:** `git revert <bad commit>`, then push. The gated pipeline redeploys. You can re-run an
  older successful deploy within 30 days (`gh run rerun <run-id>`), but that repeats the whole quality bar.
- **Take the site down (emergency):** this disables Pages. Re-enable it with the first-deploy `gh api` command.
  ```bash
  gh api -X DELETE repos/MndTheNerd/mndx-site/pages
  ```

## Known push failures
- **GH007** ("push declined due to email privacy restrictions"): the commit author email is private on the
  account. Re-author the commits with the account's noreply address, `<id>+MndTheNerd@users.noreply.github.com`,
  where `<id>` comes from `gh api user --jq .id`. Re-authoring changes every SHA, so delete the release tag
  and create it again on the new HEAD (`git tag -d v1.0.0`, then `git tag -a v1.0.0 -m "v1.0.0"`), then push.

## After the first deploy (manual, the owner's accounts)
- Submit `https://mndthenerd.github.io/mndx-site/sitemap-index.xml` in Google Search Console. The property is
  verified by `public/google8cec30e54942f93e.html`: **don't delete that file**, or ownership is lost.
- Check the share card in the X / LinkedIn / Facebook card validators.
- Optional: set the mndx repo's About → Website to the site URL.
