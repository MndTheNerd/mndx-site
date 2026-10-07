import { expect, test } from './fixtures';

const MARKETPLACE = 'claude plugin marketplace add MndTheNerd/mndx';
const block = (page: import('@playwright/test').Page, command: string) =>
  page.locator('.hero [data-copy]', { hasText: command });

/** Install a fake clock and freeze it after load, so timers only advance through clock.runFor. */
async function loadWithFrozenClock(page: import('@playwright/test').Page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('./');
  await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
}

/**
 * Makes every clipboard write slow with real same-origin I/O that the fake clock can't skip, the way a slow CI
 * runner is. Tests must then wait for each copy to finish before advancing the clock (fix 005).
 */
const slowClipboard = () => {
  const original = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = async (text: string) => {
    for (let i = 0; i < 5; i += 1) await fetch('favicon.svg', { cache: 'no-store' });
    return original(text);
  };
};

test.describe('with clipboard access', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(slowClipboard);
    await loadWithFrozenClock(page);
  });

  test('shows copy buttons once JavaScript runs (AC1, AC12)', async ({ page }) => {
    await expect(page.locator('.hero [data-copy-button]')).toHaveCount(2);
    for (const button of await page.locator('[data-copy-button]').all()) await expect(button).toBeVisible();
    await expect(page.locator('#install [data-copy-button]')).toHaveCount(3);
  });

  test('copies the exact command, says "Copied", then reverts after 2 seconds (AC2)', async ({ page }) => {
    const command = block(page, MARKETPLACE);
    const button = command.getByRole('button');
    await button.click();

    // "Copied" appears in the same synchronous block that schedules the reset timer, so once it shows,
    // the clock may be advanced. The clipboard itself is written just before, so poll for it.
    await expect(button).toHaveText('Copied');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(MARKETPLACE);
    await expect(command.getByRole('status')).toHaveText('Copied');

    await page.clock.runFor(1999);
    await expect(command.locator('[data-copy-label]')).toHaveText('Copied');
    await page.clock.runFor(1);
    await expect(command.locator('[data-copy-label]')).toHaveText('Copy');
    await expect(command.getByRole('status')).toHaveText('');
  });

  test('empties the live region before each "Copied", so a second copy is announced again (AC2)', async ({
    page,
  }) => {
    const command = block(page, MARKETPLACE);
    await command.getByRole('button').click();
    await expect(command.getByRole('status')).toHaveText('Copied');

    const values = await command.getByRole('status').evaluate(
      (status) =>
        new Promise<string[]>((resolve) => {
          const seen: string[] = [];
          new MutationObserver(() => {
            seen.push(status.textContent ?? '');
            if (seen.at(-1) === 'Copied') resolve(seen);
          }).observe(status, { childList: true, characterData: true, subtree: true });
          status.closest('[data-copy]')?.querySelector('button')?.click();
        }),
    );
    expect(values).toEqual(['', 'Copied']);
  });

  test('restarts the 2 second timer on a second copy (AC2)', async ({ page }) => {
    const command = block(page, MARKETPLACE);
    const label = command.locator('[data-copy-label]');
    await command.getByRole('button').click();
    await expect(label).toHaveText('Copied'); // first activation's timer now exists
    await page.clock.runFor(1500);

    // The label already reads "Copied", so it can't show when the second activation finishes. Watch the status
    // instead: arm an observer in the page, do a real click, then wait for the status to be set to "Copied".
    type WithSecondCopy = Window & { secondCopy?: Promise<void> };
    await command.getByRole('status').evaluate((status) => {
      (window as WithSecondCopy).secondCopy = new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (status.textContent === 'Copied') {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(status, { childList: true, characterData: true, subtree: true });
      });
    });
    await command.getByRole('button').click();
    await page.evaluate(() => (window as WithSecondCopy).secondCopy);

    await page.clock.runFor(1500);
    await expect(label).toHaveText('Copied');
    await page.clock.runFor(500);
    await expect(label).toHaveText('Copy');
  });

  for (const key of ['Enter', 'Space']) {
    test(`copies from the keyboard with ${key} (AC3)`, async ({ page }) => {
      const button = page.getByRole('button', { name: `Copy: ${MARKETPLACE}` }).first();
      await expect(button).toBeVisible();
      // Tab from the start of the page until the copy button has focus.
      for (let i = 0; i < 10 && !(await button.evaluate((el) => el === document.activeElement)); i += 1) {
        await page.keyboard.press('Tab');
      }
      await expect(button).toBeFocused();
      await page.keyboard.press(key);
      await expect(block(page, MARKETPLACE).locator('[data-copy-label]')).toHaveText('Copied');
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(MARKETPLACE);
    });
  }
});

const withoutClipboard = () =>
  Object.defineProperty(Navigator.prototype, 'clipboard', { get: () => undefined, configurable: true });

test.describe('when the Clipboard API is unavailable (AC4)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(withoutClipboard);
    await loadWithFrozenClock(page);
  });

  test('selects the command and tells the visitor to copy it', async ({ page }) => {
    const command = block(page, MARKETPLACE);
    await command.getByRole('button').click();

    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(MARKETPLACE);
    await expect(command.locator('[data-copy-label]')).toHaveText('Copy');
    const status = command.getByRole('status');
    await expect(status).toHaveText('Press Ctrl+C or ⌘C to copy');
    await expect(status).toBeVisible();

    await page.clock.runFor(5999);
    await expect(status).toHaveText('Press Ctrl+C or ⌘C to copy');
    await page.clock.runFor(1);
    await expect(status).toHaveText('');
  });

  test('clears the message on the next activation', async ({ page }) => {
    const first = block(page, MARKETPLACE);
    await first.getByRole('button').click();
    await expect(first.getByRole('status')).not.toHaveText('');
    // The handler empties the status before retrying; observe the cleared state via a mutation record.
    const sawCleared = await first.getByRole('status').evaluate(
      (status) =>
        new Promise<boolean>((resolve) => {
          new MutationObserver((records) => {
            if (records.some(() => status.textContent === '')) resolve(true);
          }).observe(status, { childList: true, characterData: true, subtree: true });
          status.closest('[data-copy]')?.querySelector('button')?.click();
        }),
    );
    expect(sawCleared).toBe(true);
  });

  test.describe('on a touch screen', () => {
    test.use({ hasTouch: true, isMobile: true });

    test('words the message for touch', async ({ page }) => {
      expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
      const command = block(page, MARKETPLACE);
      await command.getByRole('button').click();
      await expect(command.getByRole('status')).toHaveText('Select the command and copy it');
    });
  });
});
