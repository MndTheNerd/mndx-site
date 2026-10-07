# 005-copy-timer-e2e-test-races-the-clipboard — Bug: copy timer e2e test races the clipboard write on slow CI

> **Status:** APPROVED by you · 2026-10-07
> Kind: fix · Created: 2026-10-07

## Symptom
The first GitHub Actions run of `deploy.yml` (run 37614814559, commit `9d8e628`, tag `v1.0.0`) failed in the
quality bar, so build and deploy were skipped and nothing was published:

```
tests/e2e/copy.spec.ts:72  › with clipboard access › restarts the 2 second timer on a second copy (AC2)
  expect(locator).toHaveText('Copy') — 14 × locator resolved to <span data-copy-label>Copied</span>
```

The test passes locally: 135/135 runs with `--repeat-each 15 --workers 8`. The site itself behaves
correctly. This is a test defect, and it blocks every deploy.

## Reproduction
1. `.scratch/repro/` has a Playwright config that serves the built site, and `repro.spec.ts`, which slows
   `navigator.clipboard.writeText` with 5 real same-origin `fetch` calls (I/O the fake clock can't skip),
   the way a slow CI runner does.
2. Variant 1 runs the failing test's steps. It adds one `waitForTimeout(1000)` and a log before the "Copied"
   assertion, so the slowed writes have real time to finish, which doesn't weaken the proof. It fails 5/5, on
   the same assertion as CI: after the last `runFor(500)` the label is still "Copied".
3. Variant 2 runs the same timeline, but after each click it waits until that activation has written "Copied"
   to its status. It passes 5/5. It clicks with a DOM `button.click()` inside `evaluate`, so it proves the
   settling rule, not the exact helper in the fix. The Green run proves the helper.

Reproduced: yes. It's deterministic with the slowed clipboard.

## Root cause
`initCopyButtons` (`src/scripts/copy.ts`) awaits `copyText(...)` before it schedules the 2 s reset timer.
That's correct for users: the timer starts when the copy has actually happened.

The test advances the fake clock right after each click (`tests/e2e/copy.spec.ts`, "restarts the 2 second
timer on a second copy": `click()` then `page.clock.runFor(1500)`). On a slow machine the clipboard write
hasn't resolved yet, so `runFor` advances time before the timer exists. The timer then starts late, at
roughly t = 3000 instead of t = 1500, and is still pending when the test expects "Copy" at t = 3500.

A label stuck on "Copied" at t = 3500 can only mean the second activation's timer was scheduled after
t = 1500. Settling each activation before `runFor` rules that out.

**Defensive hardening, not a proven race:** three tests read the clipboard once with
`expect(await readText())` right after acting:
- "copies the exact command…" (AC2)
- the keyboard tests (AC3), Enter and Space

They passed on both CI attempts (`retries: 1`), possibly because Chromium makes `readText` wait for a pending
write. A single unretried read is still fragile, so they move to `expect.poll`.

## Fix plan
Test-only change, in `tests/e2e/copy.spec.ts`. No product code changes.
The fix uses one settling rule. `copy.ts` sets the "Copied" label in the same synchronous block that schedules
the reset timer. So when the label reads "Copied" after starting from "Copy", that activation's timer exists.

1. **"restarts the 2 second timer":**
   - First click: `await expect(label).toHaveText('Copied')` before `runFor(1500)`.
   - Second click: the label already reads "Copied" from the first click, so the label can't show that the
     second activation finished. Instead, a helper arms a `MutationObserver` in the page with `page.evaluate`.
     The observer stores a promise on `window`. Its callback checks `status.textContent === 'Copied'` (not
     the mutation records, so the synchronous reset to `''` is skipped), then disconnects and resolves. The
     test then does a real Playwright `click()` and awaits that promise with a second `page.evaluate`, all
     before `runFor(1500)`.
2. **"reverts after 2 seconds":** only change its clipboard read to `expect.poll(readText)`. The existing
   `toHaveText('Copied')` before `runFor` already settles the click.
3. **Keyboard tests:** keep the real `keyboard.press(key)`. Then `await expect(label).toHaveText('Copied')`,
   and read the clipboard with `expect.poll`.
4. **Slowdown:** in the `with clipboard access` describe's `beforeEach`, call `page.addInitScript` with the
   slow-clipboard wrapper, exactly as in `.scratch/repro/repro.spec.ts`. It wraps
   `navigator.clipboard.writeText` so that it awaits `fetch('favicon.svg', { cache: 'no-store' })` five times,
   then calls the original. The relative URL resolves under `/mndx-site/`, which is same-origin and allowed by
   the CSP. `no-store` keeps the fetches slow enough. It must come before
   `loadWithFrozenClock` / `page.goto`. Every copy test then runs under the CI-like slowdown on every machine,
   so this class of race fails locally instead of only on CI.

## Regression test
Step 4 is the regression test, and it goes in first.
- **Red:** with the slowdown in place and before steps 1–3, "restarts the 2 second timer" must fail on this
  machine, as on CI. Any of the three hardened tests may also fail, depending on how `readText` behaves. The
  red run records exactly which ones fail.
- **Green:** after steps 1–3, all of them pass, and the whole copy spec runs under the slowdown with
  `--repeat-each 10 --workers 8` without a failure.

## Concerns
| Concern | Why | Check |
|---|---|---|
| Testing | The defect is a non-deterministic e2e test, and it blocks the deploy gate | red→green under the slowdown; `--repeat-each 10`; full quality bar |
| DevOps | CI blocks every deploy until this is fixed | the re-pushed deploy run goes green |
| Security | The test-only slowdown fetches `favicon.svg` (same-origin, allowed by `connect-src 'self'`). The CSP is unchanged | the console-error fixture in the spec |

## Blast radius
Only `tests/e2e/copy.spec.ts`. The product scripts, the other specs, and the AC coverage map are unchanged:
the same ACs, asserted more reliably. The release tag `v1.0.0` already exists locally and on GitHub, at a
commit whose tests are flaky. The site code at that tag is correct and the fix is test-only, so v1.0.0 stays.
The fix ships as a follow-up commit, and pushing it triggers the deploy. The tag isn't moved. The
release doc's **Deploy result** will record:
- the SHA and run ID actually deployed
- that `v1.0.0` (`9d8e628`) failed its first quality-bar run because of this test defect
- that the tag was deliberately left in place
