import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..');

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

const sources = ['src/components', 'src/pages', 'src/layouts', 'src/scripts'].flatMap((dir) =>
  filesUnder(join(ROOT, dir)).filter((file) => /\.(astro|ts)$/.test(file)),
);

describe('source rules', () => {
  it('finds the source files to check', () => {
    expect(sources.length).toBeGreaterThan(5);
  });

  // Spec 002, NFR-S1: the strict CSP forbids inline styles and unhashed inline scripts; these APIs are injection risks.
  it.each([
    ['innerHTML', /\binnerHTML\b/],
    ['eval(', /\beval\(/],
    ['new Function', /new Function\b/],
    ['inline style attributes', /\sstyle=/],
    ['define:vars', /define:vars/],
    ['is:inline scripts', /is:inline/],
  ])('never uses %s', (_, pattern) => {
    const offenders = sources.filter((file) => pattern.test(readFileSync(file, 'utf8')));
    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });

  // Spec 002, NFR-A1: components take every color from the design tokens.
  it('uses no raw hex colors in components', () => {
    const offenders = sources
      .filter((file) => file.includes(join('src', 'components')))
      .filter((file) =>
        /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(file, 'utf8').replace(/href=\{[^}]*\}/g, '')),
      );
    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });
});
