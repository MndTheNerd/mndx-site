import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, test } from './fixtures';

// Runs after playwright.config's webServer has built dist/ (spec 002, NFR-P1).
const DIST = join(process.cwd(), 'dist');
const BASE = '/mndx-site/';
const KB = 1024;

const read = (assetUrl: string) => readFileSync(join(DIST, assetUrl.slice(BASE.length)));
const gzipSize = (content: Buffer | string) => gzipSync(content).length;

test('never requests the share image while loading the page (spec 003, AC6)', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('./', { waitUntil: 'load' });
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.filter((url) => url.endsWith('og.png'))).toEqual([]);
});

test('first load stays within 100 KB, with at most 5 KB of JavaScript', () => {
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');

  const stylesheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(
    (m) => m[1] ?? '',
  );
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1] ?? '');
  // JSON-LD is data, not JavaScript: it counts in the HTML total but not against the JS budget.
  const inlineScripts = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1] ?? '');
  const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1] ?? '');

  const css = [...stylesheets.map((url) => read(url).toString('utf8')), ...inlineStyles].join('\n');
  const fonts = [...new Set([...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1] ?? ''))];

  const jsBytes =
    scripts.reduce((sum, url) => sum + gzipSize(read(url)), 0) +
    inlineScripts.reduce((sum, body) => sum + (body.trim() ? gzipSize(body) : 0), 0);
  const fontBytes = fonts.reduce((sum, url) => sum + read(url).length, 0);
  const total =
    gzipSize(html) + stylesheets.reduce((sum, url) => sum + gzipSize(read(url)), 0) + jsBytes + fontBytes;

  console.log(
    `budget: total ${(total / KB).toFixed(1)} KB (fonts ${(fontBytes / KB).toFixed(1)} KB in ${fonts.length} files, ` +
      `JS ${(jsBytes / KB).toFixed(1)} KB)`,
  );
  expect(fonts.length).toBeGreaterThan(0);
  expect(total).toBeLessThanOrEqual(100 * KB);
  expect(jsBytes).toBeLessThanOrEqual(5 * KB);
});
