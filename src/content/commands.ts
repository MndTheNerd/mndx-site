export interface Command {
  name: string;
  /** Argument syntax as the README shows it, or '' when the command takes none. */
  args: string;
  summary: string;
  /** Only the user may run it; Claude can't (approvals, abandoning, autopilot). */
  userOnly: boolean;
}

/** Every /mndx command, in the README's order. */
export const commands: readonly Command[] = [
  {
    name: '/mndx:init',
    args: '[idea]',
    summary:
      'New project: interview, docs, setup chore. Existing code: learn, audit, then rebuild, fix or keep.',
    userOnly: false,
  },
  {
    name: '/mndx:assess',
    args: '[focus]',
    summary: 'Re-audit an existing codebase and choose again.',
    userOnly: false,
  },
  {
    name: '/mndx:spec',
    args: '<idea>',
    summary: 'Start a feature: routed concerns and a spec with testable acceptance criteria.',
    userOnly: false,
  },
  { name: '/mndx:plan', args: '', summary: 'Technical plan for the approved spec.', userOnly: false },
  { name: '/mndx:build', args: '', summary: 'Implement the approved plan, test-first.', userOnly: false },
  {
    name: '/mndx:verify',
    args: '',
    summary:
      'Quality bar, proof for every acceptance criterion, concern checklists, independent code review.',
    userOnly: false,
  },
  {
    name: '/mndx:ship',
    args: '',
    summary: 'Update docs and changelog, commit locally, close the item.',
    userOnly: false,
  },
  {
    name: '/mndx:fix',
    args: '<bug>',
    summary: 'Root cause, then bug.md, then a regression test first, then the fix.',
    userOnly: false,
  },
  { name: '/mndx:chore', args: '<task>', summary: 'Small non-feature work.', userOnly: false },
  { name: '/mndx:status', args: '', summary: 'Where you are and the exact next step.', userOnly: false },
  {
    name: '/mndx:route',
    args: '<task>',
    summary: 'Which concerns, checklists and skills a task needs.',
    userOnly: false,
  },
  {
    name: '/mndx:release',
    args: '[version] [deploy]',
    summary: 'Gated release: version, changelog, check, local tag. Deploys only if asked.',
    userOnly: false,
  },
  {
    name: '/mndx:skills',
    args: '[list|install|update|rollback]',
    summary: 'Manage the community skills. Updates are snapshotted and risk-scanned.',
    userOnly: false,
  },
  { name: '/mndx:approve', args: '[doc]', summary: 'Approve the waiting doc.', userOnly: true },
  { name: '/mndx:abandon', args: '[reason]', summary: 'Drop the active item.', userOnly: true },
  { name: '/mndx:autopilot', args: '<goal|stop>', summary: 'Run everything unattended.', userOnly: true },
];
