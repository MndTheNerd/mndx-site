import { repoFile, seo, site } from '../content/site';

/** schema.org SoftwareApplication for MNDX (spec 003, AC4). Every claim is backed by the page or the repo. */
export function softwareApplication(canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MNDX',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Windows, Linux', // the README: CI runs on Ubuntu and Windows
    description: seo.description,
    url: canonicalUrl,
    sameAs: site.repoUrl,
    license: repoFile('LICENSE'),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: 'mndthenerd', url: 'https://github.com/MndTheNerd' },
  } as const;
}

/** JSON for a <script type="application/ld+json"> block, with "<" escaped so it can't close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
