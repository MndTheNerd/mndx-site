# 005-copy-timer-e2e-test-races-the-clipboard — Verification

> Filled in by /mndx:verify. Re-run after any fix.

## Quality bar
From `mndx.js check` (recorded in `.mndx/checks.json`), run after the last change:

| Check | Command | Result |
|---|---|---|
| Format | `npm run format:check` | ✅ |
| Lint | `npm run lint` | ✅ 0 errors, 0 warnings |
| Typecheck | `npm run typecheck` | ✅ 0 errors, 0 warnings, 0 hints |
| Tests | `npm test` | ✅ 36 passed, 0 failed |
| E2E | `npm run test:e2e` | ✅ 57 passed, 0 failed |
| Build | `npm run build` | ✅ |

## Acceptance criteria → tests
A fix has no ACs. Its regression test is the `slowClipboard` init script now in `tests/e2e/copy.spec.ts`:

| Requirement from `bug.md` | Evidence | Result |
|---|---|---|
| **Red first:** with the slowdown added and the old test steps, the restart test fails | 12 failures in 3 repeats: **4 tests fail on every repeat**: "restarts the 2 second timer", "copies the exact command… reverts after 2 seconds", and the keyboard tests for Enter and Space | ✅ red |
| **Green after the fix** | The copy spec passes **90/90** under the slowdown with `--repeat-each 10 --workers 8`, run twice (before and after the review's readability fixes) | ✅ green |
| Stable beyond the copy spec | The full e2e suite passes **171/171** with `--repeat-each 3 --workers 8` | ✅ |

**What the red run changed in the diagnosis:** `bug.md` called the three read-the-clipboard tests "defensive
hardening, not a proven race". The red run proves they race as well: they fail under a slow clipboard, so they
were fixed on the same footing. The fix is unchanged and the doc is still accurate about the root cause.

## Live run
This fix changes only tests, so the product has no new behavior to exercise.
- The full e2e suite runs against the **production build** under the slowdown (rows above).
- The real proof is the redeploy: the previously failing GitHub run is re-triggered by the push. It's recorded
  in release 004's **Deploy result**.

## Concern checklists
| Concern | Checklist result | Evidence |
|---|---|---|
| Testing | ✅ The race now fails locally on demand, and every copy test settles on a product signal (the label) before advancing the fake clock. No sleeps and no loosened assertions | red→green above |
| DevOps | ✅ The CI gate stays strict; only the flaky test changed | the redeploy run |
| Security | ✅ The slowdown fetches same-origin `favicon.svg`, allowed by `connect-src 'self'`. The CSP is unchanged, and the console-error fixture shows no errors | `copy.spec.ts` |

## Code review
`mndx:code-reviewer` (run on the cheaper Sonnet model): **PASS**, no blockers or majors, and 3 minors.

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | minor | The slowdown is a probabilistic delay, not a gate the test controls | Not changed. It failed on every repeat in the red run, and a controlled gate would add machinery for little gain. The slowdown only has to widen the window, and the settling rule is what makes the tests correct. |
| 2 | minor | The helper's repeated cast, and `secondCopy` leftover on `window` | The type is declared once (`WithSecondCopy`). The `window` property stays because the observer must be armed before the real click |
| 3 | minor | One line re-queried the locator instead of using `label` | Fixed |

## Deviations from the plan
`mndx.js scope`: no edits outside the plan. The only file changed is `tests/e2e/copy.spec.ts`, as `bug.md` says.

## Manual checks
- Confirm the redeployed GitHub run goes green and the live site passes the RUNBOOK smoke check. That's the
  next step, and it's recorded in release 004.

## Verdict
PASS. The last `check` is green and current, the regression test failed before the fix and passes after it,
and every review finding is resolved or explained.
