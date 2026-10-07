// Builds the share card's HTML and fingerprints everything that affects its pixels (spec 003, AC3).
// Runs under Node's type stripping (`npm run og`): keep to erasable TypeScript (no enums, no parameter
// properties) and import with explicit `.ts` extensions.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { seo } from '../../src/content/site.ts';

const fromHere = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const readText = (path: string) => readFileSync(fromHere(path), 'utf8').replace(/\r\n/g, '\n');

const FONTS: readonly { family: string; weight: number; file: string }[] = [
  {
    family: 'Overpass',
    weight: 800,
    file: '../../node_modules/@fontsource/overpass/files/overpass-latin-800-normal.woff2',
  },
  {
    family: 'Overpass Mono',
    weight: 400,
    file: '../../node_modules/@fontsource/overpass-mono/files/overpass-mono-latin-400-normal.woff2',
  },
];

function fontFaces(): string {
  return FONTS.map(({ family, weight, file }) => {
    const data = readFileSync(fromHere(file)).toString('base64');
    return `@font-face { font-family: '${family}'; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format('woff2'); }`;
  }).join('\n');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** The card as a self-contained HTML document: template + tokens + inlined fonts + the shared headline. */
export function cardHtml(): string {
  return readText('./template.html')
    .replace('{{FONTS}}', fontFaces())
    .replace('{{TOKENS}}', readText('../../src/styles/tokens.css'))
    .replace('{{HEADLINE}}', escapeHtml(seo.headline));
}

/** SHA-256 of the rendered inputs plus the generator's own source, LF-normalized. */
export function inputsHash(): string {
  return createHash('sha256')
    .update(cardHtml())
    .update(readText('./inputs.ts'))
    .update(readText('./generate.ts'))
    .digest('hex');
}
