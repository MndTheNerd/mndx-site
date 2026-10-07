import { test as base, expect } from '@playwright/test';

/**
 * Every e2e test imports `test` from here. The auto-fixture fails any test whose page logs a console error
 * or throws, so CSP violations and script errors can't slip through (spec 002, NFR-S1).
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await use(errors);
      expect(errors, 'console and page errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
