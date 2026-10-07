/** Dogfooding results and counts, quoted from the MNDX README (checked by tests/unit/content.test.ts). */
export const proof = {
  app: 'a habit tracker',
  majorDefects: 16,
  testsGreen: 76,
  skillCount: 45,
} as const;

export const proofParagraphs: readonly string[] = [
  `MNDX was dogfooded by building a real app, ${proof.app}, end to end under autopilot.`,
  `Its reviewers found ${proof.majorDefects} major defects across the spec, plan and code before anything shipped.`,
  `mndx.js check caught a typecheck and build failure while all ${proof.testsGreen} tests were green.`,
];

export type LimitKey = 'watchdog' | 'legal' | 'permissions';

export const limits: readonly { key: LimitKey; text: string }[] = [
  {
    key: 'watchdog',
    text: "The shell watchdog detects and reports code written through the shell, but doesn't undo it, and it needs git.",
  },
  {
    key: 'legal',
    text: "The compliance, payments and store checklists flag what commonly applies. They aren't legal advice: those items always go to a human.",
  },
  {
    key: 'permissions',
    text: 'Autopilot needs a permissive permission mode to run unattended. It never pushes, deploys or spends money.',
  },
];
