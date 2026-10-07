import { expect, test } from './fixtures';

for (const width of [320, 390, 768, 1280]) {
  test(`never scrolls sideways at ${width} px, and long content scrolls in its own box (AC14)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');

    const doc = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(doc.scroll).toBeLessThanOrEqual(doc.client);

    for (const command of await page.locator('[data-copy-text]').all()) {
      const fits = await command.evaluate((el) => {
        const overflowX = getComputedStyle(el).overflowX;
        return el.scrollWidth <= el.clientWidth || overflowX === 'auto' || overflowX === 'scroll';
      });
      expect(fits, await command.innerText()).toBe(true);
    }

    const wrap = page.locator('#commands .table-wrap');
    expect(await wrap.evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto');
    await expect(page.locator('#commands caption')).toBeVisible();
    // Command names never break mid-word; arguments may wrap at spaces and after "|".
    const names = page.locator('#commands tbody th .name');
    await expect(names).toHaveCount(16);
    const nowrap = await names.evaluateAll((spans) =>
      spans.every((span) => getComputedStyle(span).whiteSpace === 'nowrap'),
    );
    expect(nowrap).toBe(true);
  });
}

test('loses no content at 200 % zoom, emulated as a 640 px viewport (AC15)', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto('./');
  const doc = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(doc).toBe(true);
  const clipped = await page.locator('h1, h2, h3, p, li').evaluateAll((elements) =>
    elements
      // Screen-reader-only text is clipped on purpose.
      .filter((el) => !el.closest('.visually-hidden') && el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent?.slice(0, 40)),
  );
  expect(clipped).toEqual([]);
});

test.describe('diagram orientation (AC5)', () => {
  test('is horizontal from 900 px', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto('./');
    await expect(page.locator('.track.horizontal')).toBeVisible();
    await expect(page.locator('.track.vertical')).toBeHidden();
  });

  test('is vertical below 900 px', async ({ page }) => {
    await page.setViewportSize({ width: 899, height: 900 });
    await page.goto('./');
    await expect(page.locator('.track.vertical')).toBeVisible();
    await expect(page.locator('.track.horizontal')).toBeHidden();
  });
});
