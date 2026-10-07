import { afterEach, describe, expect, it, vi } from 'vitest';
import { joinBase, withBase } from '../../src/lib/url';

describe('withBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Vitest doesn't apply Astro's `base`, so stub BASE_URL the way `astro build` sets it.
  it("prefixes paths with the site's configured base", () => {
    vi.stubEnv('BASE_URL', '/mndx-site/');
    expect(withBase('og.png')).toBe('/mndx-site/og.png');
    expect(withBase('/')).toBe('/mndx-site/');
  });
});

describe('joinBase', () => {
  it('returns the base itself for the root path', () => {
    expect(joinBase('/mndx-site/', '/')).toBe('/mndx-site/');
    expect(joinBase('/mndx-site/', '')).toBe('/mndx-site/');
  });

  it('joins a path with exactly one slash between base and path', () => {
    expect(joinBase('/mndx-site/', 'og.png')).toBe('/mndx-site/og.png');
    expect(joinBase('/mndx-site/', '/og.png')).toBe('/mndx-site/og.png');
    expect(joinBase('/mndx-site', 'og.png')).toBe('/mndx-site/og.png');
  });

  it('keeps a trailing slash on directory paths', () => {
    expect(joinBase('/mndx-site/', 'docs/')).toBe('/mndx-site/docs/');
  });

  it('works when the site is served from the domain root', () => {
    expect(joinBase('/', 'og.png')).toBe('/og.png');
    expect(joinBase('/', '/')).toBe('/');
  });

  it('keeps hash fragments intact', () => {
    expect(joinBase('/mndx-site/', '#install')).toBe('/mndx-site/#install');
  });
});
