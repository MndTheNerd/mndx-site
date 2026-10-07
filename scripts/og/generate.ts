// Renders public/og.png (1200×630) from template.html and records the inputs' hash (spec 003, AC3).
//
//   npm run format   # first: formatting changes hashed files
//   npm run og       # needs Node ≥ 22.18 (type stripping) and `npx playwright install chromium` once
//
// Keep to erasable TypeScript (no enums, no parameter properties); see inputs.ts.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { cardHtml, inputsHash } from './inputs.ts';

const output = fileURLToPath(new URL('../../public/og.png', import.meta.url));
const hashFile = fileURLToPath(new URL('./inputs.sha256', import.meta.url));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setContent(cardHtml());
  await page.evaluate(() => document.fonts.ready);
  const fontsLoaded = await page.evaluate(() => document.fonts.check('800 84px Overpass'));
  if (!fontsLoaded) throw new Error('Overpass did not load; the card would render in a fallback font');
  await page.screenshot({ path: output, type: 'png' });
} finally {
  await browser.close();
}

writeFileSync(hashFile, `${inputsHash()}\n`);
console.log(`Wrote ${output}`);
