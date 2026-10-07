import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    test('loads under the base path with one h1 and no console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));

      const response = await page.goto('./');

      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page).toHaveTitle(/MNDX/);
      expect(errors).toEqual([]);
    });

    test('has no WCAG 2.2 AA violations', async ({ page }) => {
      await page.goto('./');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    test('uses the design-system background for this color scheme', async ({ page }) => {
      await page.goto('./');
      const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(background).toBe(colorScheme === 'light' ? 'rgb(230, 236, 238)' : 'rgb(18, 28, 37)');
    });
  });
}

test('renders the heading in self-hosted Overpass', async ({ page, baseURL }) => {
  const fontOrigins: string[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'font') fontOrigins.push(new URL(response.url()).origin);
  });

  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  const loadedFamilies = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family),
  );

  expect(loadedFamilies).toContain('Overpass');
  expect(fontOrigins.length).toBeGreaterThan(0);
  expect(new Set(fontOrigins)).toEqual(new Set([new URL(baseURL ?? '').origin]));
});

test('declares a same-origin content security policy', async ({ page }) => {
  await page.goto('./');
  const policy = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("object-src 'none'");
});
