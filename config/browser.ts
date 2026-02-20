import { devices } from '@playwright/test';

/**
 * Browser Configuration Abstraction
 * Allows switching between devices/browsers without changing the core project config.
 */
export const BROWSER_CONFIG = {
    desktop: devices['Desktop Chrome'],
    firefox: devices['Desktop Firefox'],
    webkit: devices['Desktop Safari'],
    mobile: devices['iPhone 13'],
};

export const DEFAULT_BROWSER = BROWSER_CONFIG.desktop;
