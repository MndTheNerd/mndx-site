import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Facts extracted from the vendored MNDX README, the page's source of truth (spec 002, AC16). */
export interface ReadmeFacts {
  installCommands: string[];
  setupCommand: string;
  commands: { name: string; args: string; userOnly: boolean }[];
  /** The README's prose with line breaks and runs of spaces collapsed, for phrase and number checks. */
  prose: string;
  limits: string[];
}

const fixturePath = fileURLToPath(new URL('../fixtures/mndx-readme.md', import.meta.url));

function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(`\n## ${heading}\n`);
  if (start === -1) throw new Error(`README has no "## ${heading}" section`);
  const rest = markdown.slice(start + heading.length + 5);
  const end = rest.search(/\n## /);
  return end === -1 ? rest : rest.slice(0, end);
}

export function parseReadme(markdown: string): ReadmeFacts {
  const install = section(markdown, 'Install');
  const installCommands = [...install.matchAll(/```bash\n(.+)\n```/g)].map((match) => match[1] ?? '');

  const setupMatch = install.match(/run `(\/mndx:skills install all)`/);
  if (!setupMatch?.[1]) throw new Error('README has no setup command in Install');

  const commands = [
    ...section(markdown, 'Use').matchAll(/^\| `(\/mndx:[\w-]+)(?: ([^`]+))?` \| (.+) \|$/gm),
  ].map((match) => ({
    name: match[1] ?? '',
    args: (match[2] ?? '').replace(/\\\|/g, '|'), // table cells escape pipes as \|
    userOnly: (match[3] ?? '').startsWith('**You only.**'),
  }));

  const limits = section(markdown, 'Limits, honestly')
    .split(/\n- /)
    .slice(1)
    .map((item) => item.replace(/\s+/g, ' ').trim());

  return {
    installCommands,
    setupCommand: setupMatch[1],
    commands,
    prose: markdown.replace(/\s+/g, ' '),
    limits,
  };
}

export function readFixture(): ReadmeFacts {
  return parseReadme(readFileSync(fixturePath, 'utf8').replace(/\r\n/g, '\n'));
}
