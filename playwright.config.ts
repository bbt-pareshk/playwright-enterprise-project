import { defineConfig } from '@playwright/test';
import { ENV } from './config/env';
import { DEFAULT_BROWSER } from './config/browser';

const isCI = ENV.IS_CI;

export default defineConfig({
  testDir: './specs',
  globalSetup: './lib/utils/global-setup.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,

  forbidOnly: isCI,
  retries: isCI ? 0 : 0,
  workers: isCI ? 3 : 3,

  outputDir: 'test-results',

  reporter: [
    ['list'],
    ['html', { open: isCI ? 'never' : 'always' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    ...DEFAULT_BROWSER,
    baseURL: ENV.BASE_URL,
    headless: isCI,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 40_000,
  },

  projects: [
    {
      name: 'setup-auth',
      testMatch: /.*\.setup\.ts/,
    },

    // Parallel-safe isolated tests (existing + new onboarding/hosting/payment specs)
    {
      name: 'default',
      use: { ...DEFAULT_BROWSER },
      dependencies: ['setup-auth'],
      testIgnore: [/.*\.setup\.ts/, /specs\/features\/flows\/.*/],
      fullyParallel: true,
    },

    // Full E2E Journey Flows — each file runs serial, files run in parallel
    {
      name: 'e2e-flows',
      use: { ...DEFAULT_BROWSER },
      testMatch: /specs\/features\/flows\/.*/,
      fullyParallel: false,
      workers: 2,
    },
  ],
});
