/**
 * Playwright configuration for visual regression testing and
 * cross-browser testing matrix.
 *
 * This config is NOT active until a hosted demo is available.
 * It defines the infrastructure so tests can be added incrementally.
 *
 * Usage:
 *   npx playwright test                    # run all tests
 *   npx playwright test --update-snapshots # update visual baselines
 *   npx playwright test --project=firefox  # run on a single browser
 *
 * Prerequisites:
 *   npx playwright install
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  /* Shared settings for all browsers */
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Cross-browser testing matrix: latest 2 versions of each major browser */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    /* Mobile viewports for responsive testing */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Visual regression snapshot settings */
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
})
