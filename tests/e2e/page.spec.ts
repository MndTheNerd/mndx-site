import { expect, test } from './fixtures';

const REPO = 'https://github.com/MndTheNerd/mndx';
const blob = (path: string) => `${REPO}/blob/main/${path}`;
const INSTALL = ['claude plugin marketplace add MndTheNerd/mndx', 'claude plugin install mndx@mndx'];

test.describe('hero (AC1)', () => {
  test('shows the header, headline, lead and both install commands', async ({ page }) => {
    await page.goto('./');
    const header = page.getByRole('banner');
    await expect(header.getByText('MNDX', { exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', REPO);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      "Claude doesn't write code until you say go.",
    );
    await expect(page.locator('.lead')).toContainText('Claude Code plugin');

    const hero = page.locator('.hero');
    for (const command of INSTALL) {
      await expect(hero.locator('[data-copy-text]', { hasText: command })).toBeVisible();
      await expect(
        hero.locator('[data-copy]', { hasText: command }).locator('[data-copy-button]'),
      ).toHaveCount(1);
    }
  });

  for (const { width, height, inView } of [
    { width: 1280, height: 800, inView: ['h1', '.lead', ...INSTALL] },
    { width: 390, height: 844, inView: ['h1', '.lead'] },
  ]) {
    test(`keeps the essentials in the first viewport at ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('./');
      for (const target of inView) {
        const locator = target.startsWith('claude')
          ? page.locator('.hero [data-copy-text]', { hasText: target })
          : page.locator(target);
        const box = await locator.boundingBox();
        if (!box) throw new Error(`${target} is not rendered`);
        expect(box.y + box.height, `${target} bottom`).toBeLessThanOrEqual(height);
      }
    });
  }
});

test.describe('track diagram (AC5)', () => {
  test('shows five stations and two approve signals, with a screen-reader list', async ({ page }) => {
    await page.goto('./');
    const figure = page.locator('[data-walkthrough]');
    await expect(figure.locator('ol li')).toHaveText([
      /^Spec/,
      /^\/mndx:approve/,
      /^Plan/,
      /^\/mndx:approve/,
      /^Build/,
      /^Verify/,
      /^Ship/,
    ]);
    for (const svg of await figure.locator('svg').all()) {
      await expect(svg).toHaveAttribute('aria-hidden', 'true');
      await expect(svg.locator('.station text')).toHaveText(['spec', 'plan', 'build', 'verify', 'ship']);
      await expect(svg.locator('.approve')).toHaveText(['/mndx:approve', '/mndx:approve']);
      // Each signal pairs its color with a shape: a bar for stop, an arrow for proceed.
      await expect(svg.locator('.signal')).toHaveCount(2);
      await expect(svg.locator('.signal .bar')).toHaveCount(2);
      await expect(svg.locator('.signal .arrow')).toHaveCount(2);
    }
  });

  test('shows the proceed arrows in the final state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    const svg = page.locator('.track:visible');
    for (const arrow of await svg.locator('.signal .arrow').all()) await expect(arrow).toBeVisible();
    for (const bar of await svg.locator('.signal .bar').all()) await expect(bar).toBeHidden();
  });

  test('has no duplicate element IDs', async ({ page }) => {
    await page.goto('./');
    const ids = await page.locator('[id]').evaluateAll((elements) => elements.map((el) => el.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

test('lists the eight rules with their detail links (AC9)', async ({ page }) => {
  await page.goto('./');
  const section = page.locator('#what-changes');
  await expect(section.getByRole('heading', { level: 3 })).toHaveText([
    'Hard gate',
    'Verified, not claimed',
    'Concern router',
    '45 curated community skills',
    'Independent reviewers',
    'Existing projects',
    'Autopilot',
    'Runs on your Claude subscription',
  ]);
  const hrefs = await section.locator('a').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual([
    blob('docs/HOW-IT-WORKS.md'),
    blob('docs/HOW-IT-WORKS.md#ship-rules-checkjs'),
    blob('docs/CONCERNS.md'),
    blob('docs/SKILLS.md'),
    blob('docs/GUIDE.md'),
    blob('docs/EXISTING-PROJECTS.md'),
    blob('docs/AUTOPILOT.md'),
  ]);
  await expect(section).toContainText('a set of production concerns');
});

test('lists all 16 commands and marks the user-only ones (AC10)', async ({ page }) => {
  await page.goto('./');
  const table = page.locator('#commands table');
  await expect(table.locator('caption')).toBeVisible();
  await expect(table.locator('tbody tr')).toHaveCount(16);
  await expect(table.locator('tbody th')).toHaveText([
    '/mndx:init [idea]',
    '/mndx:assess [focus]',
    '/mndx:spec <idea>',
    '/mndx:plan',
    '/mndx:build',
    '/mndx:verify',
    '/mndx:ship',
    '/mndx:fix <bug>',
    '/mndx:chore <task>',
    '/mndx:status',
    '/mndx:route <task>',
    '/mndx:release [version] [deploy]',
    '/mndx:skills [list|install|update|rollback]',
    '/mndx:approve [doc]',
    '/mndx:abandon [reason]',
    '/mndx:autopilot <goal|stop>',
  ]);
  const userOnly = table.locator('tbody tr', { hasText: 'You only' }).locator('th');
  await expect(userOnly).toHaveText([
    '/mndx:approve [doc]',
    '/mndx:abandon [reason]',
    '/mndx:autopilot <goal|stop>',
  ]);
  await expect(table.locator('.you-only .bar').first()).toHaveAttribute('aria-hidden', 'true');
});

test('states the proof and the limits (AC11)', async ({ page }) => {
  await page.goto('./');
  const proof = page.locator('#proof');
  await expect(proof).toContainText('16 major defects');
  await expect(proof).toContainText('all 76 tests were green');
  await expect(proof).toContainText('habit tracker');
  await expect(proof.getByRole('link', { name: 'changelog' })).toHaveAttribute('href', blob('CHANGELOG.md'));

  const limits = page.locator('#limits li');
  await expect(limits).toHaveCount(3);
  await expect(page.locator('#limits')).toContainText("aren't legal advice");
});

test('shows requirements and three install steps (AC12)', async ({ page }) => {
  await page.goto('./');
  const install = page.locator('#install');
  await expect(install).toContainText('Claude Code, Node.js 18+, Git');
  await expect(install.locator('ol > li')).toHaveCount(3);
  await expect(install.locator('[data-copy-text]')).toHaveText([...INSTALL, '/mndx:skills install all']);
  await expect(install.locator('[data-copy-button]')).toHaveCount(3);
  await expect(install.getByRole('link', { name: 'Getting Started guide' })).toHaveAttribute(
    'href',
    blob('docs/GETTING-STARTED.md'),
  );
});

test('links only to this page and the MNDX repo, in the same tab (AC13)', async ({ page }) => {
  await page.goto('./');
  const links = await page
    .locator('a[href]')
    .evaluateAll((anchors) =>
      anchors.map((a) => ({ href: a.getAttribute('href') ?? '', target: a.getAttribute('target') })),
    );
  expect(links.length).toBeGreaterThan(0);
  for (const { href, target } of links) {
    expect(href === REPO || href.startsWith(`${REPO}/blob/main/`) || href.startsWith('#'), href).toBe(true);
    expect(target, href).toBeNull();
  }
});

test('has the landmarks and heading structure (AC15)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main section > h2')).toHaveText([
    'What changes',
    'Commands',
    'Proof',
    'Limits',
    'Install',
  ]);
  // No skipped levels: every h3 sits inside a section that has an h2.
  const orphanH3 = await page
    .locator('h3')
    .evaluateAll(
      (headings) => headings.filter((h) => !h.closest('section')?.querySelector(':scope > h2')).length,
    );
  expect(orphanH3).toBe(0);
});

test('shows a focus ring on every focusable element, with targets of at least 24 px (AC15)', async ({
  page,
}) => {
  await page.goto('./');
  // "Run it again" is disabled (unfocusable) while the walkthrough plays; wait for the run to end.
  await expect(page.getByRole('button', { name: 'Run it again' })).toBeEnabled({ timeout: 10_000 });
  const focusables = page.locator('a[href], button:not([hidden]), [tabindex="0"]');
  const count = await focusables.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const element = focusables.nth(i);
    await element.focus();
    const style = await element.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { outline: computed.outlineStyle, width: parseFloat(computed.outlineWidth) };
    });
    expect(style.outline, await element.innerText()).toBe('solid');
    expect(style.width).toBeGreaterThanOrEqual(2);

    const box = await element.boundingBox();
    if (box && (await element.evaluate((el) => !el.matches('.skip')))) {
      expect(box.height, await element.innerText()).toBeGreaterThanOrEqual(24);
      expect(box.width, await element.innerText()).toBeGreaterThanOrEqual(24);
    }
  }
});

test('has the footer licence, links and disclaimer (AC17)', async ({ page }) => {
  await page.goto('./');
  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText('MNDX is MIT licensed');
  await expect(footer.getByRole('link', { name: 'license' })).toHaveAttribute('href', blob('LICENSE'));
  await expect(footer.getByRole('link', { name: 'Repository' })).toHaveAttribute('href', REPO);
  await expect(footer.getByRole('link', { name: 'Getting Started' })).toHaveAttribute(
    'href',
    blob('docs/GETTING-STARTED.md'),
  );
  await expect(footer.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', blob('CHANGELOG.md'));
  await expect(footer).toContainText("This site isn't affiliated with Anthropic.");
});

test('uses plain copy: no superlatives, no all-caps text (NFR-C1)', async ({ page }) => {
  await page.goto('./');
  const text = (await page.locator('body').innerText()).toLowerCase();
  for (const word of [
    'revolutionary',
    'game-changing',
    'blazing',
    'seamless',
    'effortless',
    'supercharge',
    '10x',
    'magic',
  ]) {
    expect(text, word).not.toContain(word);
  }
  const uppercased = await page
    .locator('body *')
    .evaluateAll(
      (elements) => elements.filter((el) => getComputedStyle(el).textTransform === 'uppercase').length,
    );
  expect(uppercased).toBe(0);
});

test('keeps a strict same-origin CSP (NFR-S1)', async ({ page }) => {
  await page.goto('./');
  const policy =
    (await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content')) ?? '';
  expect(policy).toContain("default-src 'self'");
  expect(policy).not.toContain('unsafe-');
  expect(policy).not.toMatch(/https?:/);
});
