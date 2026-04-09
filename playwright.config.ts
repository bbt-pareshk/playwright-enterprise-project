import { defineConfig } from '@playwright/test';
import { ENV } from './config/env';
import { DEFAULT_BROWSER } from './config/browser';

// Force CI mode always as requested by the user
const isCI = true; // ENV.IS_CI;

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
    // Enterprise Fix: Force Full HD Desktop view to prevent responsive UI changes (e.g. text shortening/menu collapsing)
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      args: ['--start-maximized']
    },
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
      testIgnore: [/.*leader-functional\.setup\.ts/],
    },

    {
      name: 'setup-leader-functional',
      testMatch: /specs\/setup\/leader-functional\.setup\.ts/,
      dependencies: ['setup-auth'],
    },

    // Optimized Group Lifecycle (V2)
    {
      name: 'group-v2',
      use: { ...DEFAULT_BROWSER },
      dependencies: ['setup-leader-functional'],
      testMatch: /specs\/features\/group\/group-lifecycle-v2\.spec\.ts/,
      fullyParallel: false, // Maintain serial execution within file as requested
    },

    // Parallel-safe isolated tests (existing + new onboarding/hosting/payment specs)
    {
      name: 'default',
      use: { ...DEFAULT_BROWSER },
      dependencies: ['setup-auth'],
      testIgnore: [/.*\.setup\.ts/, /specs\/features\/flows\/.*/, /specs\/features\/group\/group-lifecycle-v2\.spec\.ts/],
      fullyParallel: true,
    },

    // Full E2E Journey Flows — each file runs serial, files run in parallel
    {
      name: 'e2e-flows',
      use: { ...DEFAULT_BROWSER },
      dependencies: ['setup-auth'],
      testMatch: /specs\/features\/flows\/.*/,
      fullyParallel: false,
      workers: 2,
    },
  ],
});
