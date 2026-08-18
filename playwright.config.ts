/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  // Isolated spec files are for targeted debugging only — excluded from the default run.
  // Run them directly: npx playwright test --config playwright.config.ts e2e/tests/isolated/tc-006-008-gameplay.spec.ts
  testIgnore: ['**/isolated/**'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 180_000,
  reporter: [
    // Rich HTML report — open with: npm run test:e2e:report
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // Console summary showing pass/fail per test
    ['list'],
    // JUnit XML for CI systems (GitHub Actions, Jenkins, etc.)
    ['junit', { outputFile: 'test-results/results.xml' }],
    // JSON for custom processing
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    headless: process.env.CI ? true : false,
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    // Capture screenshot on every failure for debugging
    screenshot: 'only-on-failure',
    // Retain video for failed tests so failures are reproducible
    video: 'retain-on-failure',
    // Full trace on first retry so failures are fully debuggable
    trace: 'on-first-retry',
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security', // allow cross-origin canvas reads in tests
        '--autoplay-policy=no-user-gesture-required', // allow audio to play without user gesture
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 585 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
