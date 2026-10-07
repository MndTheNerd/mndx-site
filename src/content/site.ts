// Keep this module import-free: `npm run og` loads it with Node's type stripping (scripts/og/inputs.ts).

/** Strings shared by the page, its metadata and the share image (spec 003), so they can't drift apart. */
export const seo = {
  title: 'MNDX: a solo product team inside Claude Code',
  description:
    'MNDX is a free Claude Code plugin that makes Claude spec, plan, test, verify and document every change, and locks code edits until you approve.',
  headline: "Claude doesn't write code until you say go.",
  imageAlt:
    "MNDX: Claude doesn't write code until you say go. A track from spec to ship with two red signals marked /mndx:approve.",
} as const;

/** The --board token for each color scheme. Head metadata can't read CSS variables; tests keep these equal. */
export const themeColors = { light: '#e6ecee', dark: '#121c25' } as const;

/** Repo facts and install steps. Checked against the MNDX README snapshot by tests/unit/content.test.ts. */
export const site = {
  repoUrl: 'https://github.com/MndTheNerd/mndx',
  installCommands: ['claude plugin marketplace add MndTheNerd/mndx', 'claude plugin install mndx@mndx'],
  setupCommand: '/mndx:skills install all',
  requirements: ['Claude Code', 'Node.js 18+', 'Git'],
} as const;

/** A file in the MNDX repo on its default branch, e.g. repoFile('docs/GUIDE.md'). */
export function repoFile(path: string): string {
  return `${site.repoUrl}/blob/main/${path.replace(/^\//, '')}`;
}
