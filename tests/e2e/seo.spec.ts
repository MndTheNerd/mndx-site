import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import config from '../../astro.config.mjs';
import { seo } from '../../src/content/site';
import { softwareApplication } from '../../src/lib/structured-data';
import { expect, test } from './fixtures';

// The canonical URL comes from the same config the site is built with (spec 003).
const CANONICAL = new URL(`${config.base?.replace(/\/?$/, '/') ?? '/'}`, config.site).href;
const DIST = join(process.cwd(), 'dist');

const meta = (page: import('@playwright/test').Page, selector: string) =>
  page.locator(`head ${selector}`).getAttribute('content');

/** The --board value for light (:root) and dark (prefers-color-scheme) from tokens.css. */
function boardTokens() {
  const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
  const values = [...css.matchAll(/--board:\s*(#[0-9a-fA-F]{6})/g)].map((m) => (m[1] ?? '').toLowerCase());
  return { light: values[0], dark: values[1] };
}

test('has the head metadata (AC1)', async ({ page }) => {
  await page.goto('./');
  const head = page.locator('head');
  for (const selector of [
    'title',
    'meta[name="description"]',
    'link[rel="canonical"]',
    'meta[name="robots"]',
  ]) {
    await expect(head.locator(selector), selector).toHaveCount(1);
  }

  const title = await page.title();
  expect(title.startsWith('MNDX')).toBe(true);
  expect(title.length).toBeGreaterThanOrEqual(30);
  expect(title.length).toBeLessThanOrEqual(60);

  const description = (await meta(page, 'meta[name="description"]')) ?? '';
  expect(description).toContain('Claude Code');
  expect(description.length).toBeGreaterThanOrEqual(110);
  expect(description.length).toBeLessThanOrEqual(160);

  await expect(head.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL);
  expect(await meta(page, 'meta[name="robots"]')).toBe('index, follow, max-image-preview:large');

  const board = boardTokens();
  const themeColors = head.locator('meta[name="theme-color"]');
  await expect(themeColors).toHaveCount(2);
  const light = await head
    .locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')
    .getAttribute('content');
  const dark = await head
    .locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')
    .getAttribute('content');
  expect(light?.toLowerCase()).toBe(board.light);
  expect(dark?.toLowerCase()).toBe(board.dark);
});

test('has the Open Graph and Twitter card tags (AC2)', async ({ page }) => {
  await page.goto('./');
  const title = await page.title();
  const description = await meta(page, 'meta[name="description"]');
  const og = (property: string) => meta(page, `meta[property="og:${property}"]`);
  const twitter = (name: string) => meta(page, `meta[name="twitter:${name}"]`);

  expect(await og('type')).toBe('website');
  expect(await og('site_name')).toBe('MNDX');
  expect(await og('title')).toBe(title);
  expect(await og('description')).toBe(description);
  expect(await og('url')).toBe(CANONICAL);
  expect(await og('image')).toBe(`${CANONICAL}og.png`);
  expect(await og('image')).toMatch(/^https:\/\//);
  expect(await og('image:type')).toBe('image/png');
  expect(await og('image:width')).toBe('1200');
  expect(await og('image:height')).toBe('630');
  expect(await og('image:alt')).toBe(seo.imageAlt);

  expect(await twitter('card')).toBe('summary_large_image');
  expect(await twitter('title')).toBe(await og('title'));
  expect(await twitter('description')).toBe(await og('description'));
  expect(await twitter('image:alt')).toBe(await og('image:alt'));
  await expect(page.locator('head meta[name="twitter:image"]')).toHaveCount(0);
});

test('has exactly one valid SoftwareApplication JSON-LD block (AC4)', async ({ page }) => {
  await page.goto('./');
  const blocks = page.locator('script[type="application/ld+json"]');
  await expect(blocks).toHaveCount(1);
  const data = JSON.parse((await blocks.textContent()) ?? '');
  // The whole rendered object, so nothing can be dropped or changed between the function and the page.
  expect(data).toEqual(softwareApplication(CANONICAL));
  expect(data.description).toBe(await meta(page, 'meta[name="description"]'));
});

test('keeps the exact CSP, with connect-src widened only to self (NFR-2)', async ({ page }) => {
  await page.goto('./');
  const policy =
    (await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content')) ?? '';
  const directives = policy
    .split(';')
    .map((directive) =>
      directive
        .trim()
        .split(/\s+/)
        .filter((token) => !token.startsWith("'sha"))
        .join(' '),
    )
    .filter(Boolean)
    .sort();
  expect(directives).toEqual(
    [
      "default-src 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
      "script-src 'self'",
      "style-src 'self'",
    ].sort(),
  );
});

test('keeps the sitemap and drops the ineffective robots.txt (AC5)', async ({ page }) => {
  const index = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf8');
  expect(index).toContain(`${CANONICAL}sitemap-0.xml`);
  const sitemap = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
  expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual([CANONICAL]);
  expect(existsSync(join(DIST, 'robots.txt'))).toBe(false);

  await page.goto('./');
  await expect(page.locator('head link[rel="sitemap"]')).toHaveCount(1);
});
