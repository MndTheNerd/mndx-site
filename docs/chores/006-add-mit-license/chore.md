# 006-add-mit-license — Chore: add MIT license

> **Status:** APPROVED by you · 2026-10-07
> Kind: chore · Created: 2026-10-07

## What & why
The site repo is public but has no license, so by default all rights are reserved: nobody may legally reuse or
fork the code. The owner asked for the license to be added ("do 1 to 6", after the question "Add MIT to match
mndx?"). MIT matches the `MndTheNerd/mndx` repo, whose LICENSE reads "Copyright (c) 2026 mndthenerd".

## Steps
- [ ] Add `LICENSE`: the standard MIT text, `Copyright (c) 2026 mndthenerd`. The holder and year match the
      mndx repo's LICENSE.
- [ ] `package.json`: `"license": "UNLICENSED"` → `"license": "MIT"`.
- [ ] `README.md`: replace "No license has been chosen yet, so all rights are reserved for now." with
      "[MIT](LICENSE) © mndthenerd. The Overpass fonts keep their own license, the SIL Open Font License 1.1
      (they're served through the `@fontsource` packages)."
- [ ] `CHANGELOG.md`: an entry under `[Unreleased]` → Added.
- [ ] Not changed: the page footer. "MNDX is MIT licensed" is about the plugin (its LICENSE link points at the
      mndx repo), and `page.spec.ts` tests that text.

## Concerns
| Concern | What this chore does about it |
|---|---|
| Legal ⚖ | Choosing a license is the owner's decision: they asked for it. MIT only covers this repo's own code. Third-party code stays under its own licenses. The fonts are SIL OFL 1.1 (`@fontsource/overpass`, `-mono`) and are named in the README. Nothing else is bundled. |
| Testing | No behavior changes. The full quality bar must stay green. `LICENSE` is plain text, so Prettier and ESLint don't check it. |
| DevOps | The deploy publishes `dist/`, which doesn't include `LICENSE`: the license lives in the repo, not on the page. |

## Done when
- `LICENSE` exists, with the same text as the mndx repo's LICENSE (MIT, `Copyright (c) 2026 mndthenerd`).
- `package.json` says `"license": "MIT"`, and the README says MIT and names the font license.
- `mndx.js check` is green, and the CHANGELOG has the entry.
- Pushing it deploys again (an identical site) and the gated run passes.
