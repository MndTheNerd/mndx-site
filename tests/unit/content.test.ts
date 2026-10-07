import { describe, expect, it } from 'vitest';
import { readFixture } from './readme';
import { site } from '../../src/content/site';
import { commands } from '../../src/content/commands';
import { limits, proof } from '../../src/content/proof';
import { rules } from '../../src/content/rules';

const readme = readFixture();

describe('page content matches the MNDX README snapshot', () => {
  it('reads the snapshot (guards the parser itself)', () => {
    expect(readme.installCommands).toHaveLength(2);
    expect(readme.commands).toHaveLength(16);
    expect(readme.limits).toHaveLength(3);
  });

  it('uses the README install commands and setup command verbatim', () => {
    expect([...site.installCommands]).toEqual(readme.installCommands);
    expect(site.setupCommand).toBe(readme.setupCommand);
  });

  it('lists all 16 commands in README order with their arguments and "You only" flags', () => {
    expect(commands.map(({ name, args, userOnly }) => ({ name, args, userOnly }))).toEqual(readme.commands);
  });

  it('quotes the README proof numbers', () => {
    expect(readme.prose).toContain(`found ${proof.majorDefects} major defects`);
    expect(readme.prose).toContain(`all ${proof.testsGreen} tests were green`);
    expect([proof.majorDefects, proof.testsGreen]).toEqual([16, 76]);
  });

  it('uses the README community skill count, and the skills rule shows it', () => {
    expect(readme.prose).toContain(`${proof.skillCount} curated community skills`);
    expect(rules.some((rule) => rule.title.includes(`${proof.skillCount} curated community skills`))).toBe(
      true,
    );
  });

  it('covers the README limits by their key phrases', () => {
    const phrases = {
      watchdog: 'watchdog',
      legal: "aren't legal advice",
      permissions: 'permissive permission mode',
    };
    for (const [key, phrase] of Object.entries(phrases)) {
      expect(readme.limits.some((limit) => limit.includes(phrase))).toBe(true);
      expect(limits.find((limit) => limit.key === key)?.text).toContain(phrase);
    }
  });
});
