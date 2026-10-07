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
