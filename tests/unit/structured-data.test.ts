import { describe, expect, it } from 'vitest';
import { serializeJsonLd, softwareApplication } from '../../src/lib/structured-data';
import { seo } from '../../src/content/site';

describe('serializeJsonLd', () => {
  it('escapes "<" so the data can never close its own <script> tag (NFR-2)', () => {
    const value = { note: 'a </script><script>alert(1)</script> b' };
    const output = serializeJsonLd(value);
    expect(output).not.toContain('</');
    expect(output).not.toContain('<');
    expect(output).toContain('\\u003c/script>');
    expect(JSON.parse(output)).toEqual(value);
  });
});

describe('softwareApplication', () => {
  it('describes MNDX exactly as the spec lists (AC4)', () => {
    expect(softwareApplication('https://mndthenerd.github.io/mndx-site/')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'MNDX',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Windows, Linux',
      description: seo.description,
      url: 'https://mndthenerd.github.io/mndx-site/',
      sameAs: 'https://github.com/MndTheNerd/mndx',
      license: 'https://github.com/MndTheNerd/mndx/blob/main/LICENSE',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'mndthenerd', url: 'https://github.com/MndTheNerd' },
    });
  });
});
