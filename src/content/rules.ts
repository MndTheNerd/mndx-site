import { proof } from './proof';

export interface Rule {
  title: string;
  body: string;
  /** Path of the guide in the MNDX repo that explains the rule, when there is one. */
  detailPath?: string;
}

/** What changes when MNDX is installed, in the README's order (spec 002, AC9). */
export const rules: readonly Rule[] = [
  {
    title: 'Hard gate',
    body: "Claude can't edit code until you approve the spec and the plan. Change an approved doc and the gate closes again. A watchdog catches code written through the shell.",
    detailPath: 'docs/HOW-IT-WORKS.md',
  },
  {
    title: 'Verified, not claimed',
    body: 'MNDX runs your real test, lint, typecheck and build commands. Shipping is refused unless they pass for the current code and the app was actually run for every acceptance criterion.',
    detailPath: 'docs/HOW-IT-WORKS.md#ship-rules-checkjs',
  },
  {
    title: 'Concern router',
    body: 'Any task in plain language is checked against a set of production concerns, such as security, privacy and legal, payments, accessibility, auth and app-store policies. Their checklists and expert skills apply all the way through.',
    detailPath: 'docs/CONCERNS.md',
  },
  {
    title: `${proof.skillCount} curated community skills`,
    body: 'From Stripe, Expo, Vercel, Anthropic, Supabase, Microsoft, Sentry, Trail of Bits and others, kept current with npx skills update.',
    detailPath: 'docs/SKILLS.md',
  },
  {
    title: 'Independent reviewers',
    body: 'Fresh-context agents critique every spec and every change.',
    detailPath: 'docs/GUIDE.md',
  },
  {
    title: 'Existing projects',
    body: 'MNDX learns the whole codebase and audits it with evidence. Then you choose: rebuild it the right way, fix what needs fixing, or keep it and continue.',
    detailPath: 'docs/EXISTING-PROJECTS.md',
  },
  {
    title: 'Autopilot',
    body: 'Give it a goal and it runs the whole pipeline unattended, then ends with an honest report.',
    detailPath: 'docs/AUTOPILOT.md',
  },
  {
    title: 'Runs on your Claude subscription',
    body: 'Everything happens inside Claude Code. No API keys, no servers.',
  },
];
