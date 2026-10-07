import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// CSS transitions run on real time, so these tests assert data-state and step classes per beat, which follow
// the fake clock exactly (plan 002, test plan AC6).

async function load(
  page: Page,
  { width, height, path = './' }: { width: number; height: number; path?: string },
) {
  await page.setViewportSize({ width, height });
  // Freeze the clock before navigating, so a slow load can't let the run start and then be fast-forwarded.
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto(path);
}

/** The visible part of the figure compared with the play threshold, from its bounding box. */
async function visibility(page: Page) {
  return page.locator('[data-walkthrough]').evaluate((figure) => {
    const rect = figure.getBoundingClientRect();
    const visible = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    return { visible, threshold: Math.min(rect.height / 2, innerHeight / 2) };
  });
}

const figure = (page: Page) => page.locator('[data-walkthrough]');
const visibleSvg = (page: Page) => page.locator('.track:visible');
const count = (page: Page, selector: string) => visibleSvg(page).locator(selector).count();

test.describe('on a desktop, where the diagram is in view on load', () => {
  test.beforeEach(async ({ page }) => {
    await load(page, { width: 1280, height: 800 });
    // The run starts from an IntersectionObserver callback shortly after load; advance the clock only after it.
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');
  });

  test('plays immediately through every beat and ends in the final state (AC6)', async ({ page }) => {
    const { visible, threshold } = await visibility(page);
    expect(visible, 'precondition: diagram past the threshold').toBeGreaterThanOrEqual(threshold);
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');

    await page.clock.runFor(0);
    expect(await count(page, '.station.is-reached')).toBe(1);
    expect(await count(page, '.signal.is-clear')).toBe(0);

    await page.clock.runFor(899);
    expect(await count(page, '.signal.is-clear'), 'still stopped at the first signal').toBe(0);
    await page.clock.runFor(1);
    expect(await count(page, '.signal.is-clear')).toBe(1);
    expect(await count(page, '.approve.is-lit')).toBe(1);
    expect(await count(page, '.segment.is-drawn')).toBe(0);

    await page.clock.runFor(300);
    expect(await count(page, '.segment.is-drawn')).toBe(1);
    await page.clock.runFor(700);
    expect(await count(page, '.station.is-reached')).toBe(2);

    await page.clock.runFor(900);
    expect(await count(page, '.signal.is-clear')).toBe(2);

    // 2800 ms have run; the final event is at 5200.
    await page.clock.runFor(2399);
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');
    await page.clock.runFor(1);
    await expect(figure(page)).toHaveAttribute('data-state', 'final');
    expect(await count(page, '.station.is-reached')).toBe(5);
    expect(await count(page, '.segment.is-drawn')).toBe(4);
  });

  test('disables "Run it again" during a run and replays from the initial state (AC6)', async ({ page }) => {
    const replay = page.getByRole('button', { name: 'Run it again' });
    await expect(replay).toBeVisible();
    await expect(replay).toBeDisabled();
    await page.clock.runFor(5200);
    await expect(replay).toBeEnabled();

    await replay.click();
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');
    await expect(replay).toBeDisabled();
    await page.clock.runFor(0);
    expect(await count(page, '.signal.is-clear')).toBe(0);
    expect(await count(page, '.segment.is-drawn')).toBe(0);
    await expect(figure(page)).not.toHaveAttribute('data-resetting');
    await page.clock.runFor(5200);
    await expect(figure(page)).toHaveAttribute('data-state', 'final');
  });

  test('keeps running when scrolled away mid-run, and plays only once (AC6)', async ({ page }) => {
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');
    await page.clock.runFor(1000);
    await page.locator('#install').scrollIntoViewIfNeeded();
    await page.clock.runFor(4200);
    await expect(figure(page)).toHaveAttribute('data-state', 'final');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.clock.runFor(100);
    await expect(figure(page)).toHaveAttribute('data-state', 'final');
  });

  test('jumps to the final state when reduced motion is switched on mid-run (AC7)', async ({ page }) => {
    await page.clock.runFor(1000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(figure(page)).toHaveAttribute('data-state', 'final');
    await expect(page.getByRole('button', { name: 'Run it again' })).toBeHidden();
  });
});

test.describe('on a phone, where the diagram starts below the threshold', () => {
  test('shows the initial state, then plays once scrolled into view (AC6)', async ({ page }) => {
    await load(page, { width: 390, height: 844 });
    const { visible, threshold } = await visibility(page);
    expect(visible, 'precondition: diagram below the threshold').toBeLessThan(threshold);

    await expect(figure(page)).toHaveAttribute('data-state', 'idle');
    const initial = await visibleSvg(page).evaluate((svg) => ({
      lamps: [...svg.querySelectorAll('.lamp')].map((lamp) => getComputedStyle(lamp).fill),
      offsets: [...svg.querySelectorAll('.segment')].map((s) => getComputedStyle(s).strokeDashoffset),
      stop: getComputedStyle(document.documentElement).getPropertyValue('--stop').trim(),
    }));
    expect(initial.offsets).toEqual(['1px', '1px', '1px', '1px']);
    expect(new Set(initial.lamps).size).toBe(1);
    expect(initial.lamps[0]).toBe('rgb(179, 38, 30)'); // --stop (#B3261E) in light mode

    await figure(page).scrollIntoViewIfNeeded();
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');
    await page.clock.runFor(5200);
    await expect(figure(page)).toHaveAttribute('data-state', 'final');
  });

  test('plays once even when "Run it again" is used before the automatic run (AC6)', async ({ page }) => {
    await load(page, { width: 390, height: 844 });
    await expect(figure(page)).toHaveAttribute('data-state', 'idle');
    // Activate without scrolling, so the automatic trigger hasn't fired yet.
    await page
      .getByRole('button', { name: 'Run it again' })
      .evaluate((button: HTMLElement) => button.click());
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');
    await page.clock.runFor(5200);
    await expect(figure(page)).toHaveAttribute('data-state', 'final');

    await figure(page).scrollIntoViewIfNeeded();
    await page.clock.runFor(100);
    await expect(figure(page)).toHaveAttribute('data-state', 'final');
  });

  test('keeps keyboard focus on "Run it again" while it is disabled during a run (AC6)', async ({ page }) => {
    await load(page, { width: 1280, height: 800 });
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');
    await page.clock.runFor(5200);
    const replay = page.getByRole('button', { name: 'Run it again' });
    await replay.focus();
    await page.keyboard.press('Enter');
    await expect(replay).toBeDisabled();
    await expect(replay).toBeFocused();
  });

  test('plays right away when the page loads with the diagram already in view (AC6)', async ({ page }) => {
    await load(page, { width: 390, height: 844, path: './#walkthrough' });
    const { visible, threshold } = await visibility(page);
    expect(visible, 'precondition: deep link puts the diagram in view').toBeGreaterThanOrEqual(threshold);
    await expect(figure(page)).toHaveAttribute('data-state', 'playing');
  });
});

test.describe('with reduced motion from the start (AC7)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the final state, no replay button, and no copy-button transition', async ({ page }) => {
    await page.goto('./');
    await expect(figure(page)).toHaveAttribute('data-state', 'final');
    await expect(page.getByRole('button', { name: 'Run it again' })).toBeHidden();
    const duration = await page
      .locator('[data-copy-button]')
      .first()
      .evaluate((button) => parseFloat(getComputedStyle(button).transitionDuration));
    expect(duration).toBeLessThan(0.001);
  });
});
