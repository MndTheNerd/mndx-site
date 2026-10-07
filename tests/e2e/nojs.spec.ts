import { expect, test } from './fixtures';

test.use({ javaScriptEnabled: false });

test('reads completely without JavaScript (AC8)', async ({ page }) => {
  await page.goto('./');

  // The scripting media feature is what keeps the diagram final here (plan 002, T6).
  expect(await page.evaluate(() => matchMedia('(scripting: none)').matches)).toBe(true);

  await expect(page.locator('main section > h2')).toHaveText([
    'What changes',
    'Commands',
    'Proof',
    'Limits',
    'Install',
  ]);
  await expect(page.locator('[data-copy-text]').first()).toBeVisible();
  await expect(page.locator('[data-copy-text]')).toHaveCount(5);

  for (const button of await page.locator('[data-copy-button], [data-replay]').all()) {
    await expect(button).toBeHidden();
  }

  const diagram = page.locator('.track:visible');
  await expect(diagram.locator('.signal .arrow')).toHaveCount(2);
  for (const arrow of await diagram.locator('.signal .arrow').all()) {
    await expect(arrow).toBeVisible();
  }
  for (const bar of await diagram.locator('.signal .bar').all()) {
    await expect(bar).toBeHidden();
  }
  const offsets = await diagram
    .locator('.segment')
    .evaluateAll((segments) => segments.map((s) => getComputedStyle(s).strokeDashoffset));
  expect(offsets).toEqual(['0px', '0px', '0px', '0px']);
});
