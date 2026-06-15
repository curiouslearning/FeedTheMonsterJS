/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
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
    baseURL: 'http://localhost:8080',
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
        '--mute-audio',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security', // allow cross-origin canvas reads in tests
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
