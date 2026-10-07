import { defineConfig, devices } from '@playwright/test';

// Not the dev server's 4321, so a running `npm run dev` is never mistaken for the production build.
const port = 4329;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}/mndx-site/`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Tests run against the production build, so the CSP and base path are exercised for real.
  webServer: {
    command: `npm run build && npm run preview -- --port ${port}`,
    url: `http://localhost:${port}/mndx-site/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
