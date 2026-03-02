import { Page, BrowserContextOptions } from '@playwright/test';
import { test as baseFixture, applyEnterpriseContextSettings } from './base.fixture';
import { LoginPage } from '../pages/auth/LoginPage';
import { users } from '../data/test-data/users';
import { UserRole } from '../data/constants/roles';
import { AuthHelper } from '../helpers/AuthHelper';
import path from 'path';

type AuthFixtures = {
    loginAs: (role: UserRole) => Promise<void>;
    memberPage: Page;
    leaderPage: Page;
};

/**
 * Enterprise Auth Fixtures
 * ------------------------
 * We use the base options from the config to ensure viewport, device settings,
 * and timeouts are preserved in role-specific contexts.
 */
export const test = baseFixture.extend<AuthFixtures>({

    loginAs: async ({ page }, use) => {
        await use(async (role: UserRole) => {
            await AuthHelper.loginAs(page, role);
        });
    },

    memberPage: async ({ browser, playwright, baseURL }, use, testInfo) => {
        // Inherit global context options (viewport, timeouts, etc.)
        const options: BrowserContextOptions = {
            ...testInfo.project.use,
            storageState: path.resolve(process.cwd(), 'storage/auth/member.json'),
            baseURL: baseURL
        };

        const context = await browser.newContext(options);
        await applyEnterpriseContextSettings(context, testInfo);

        const page = await context.newPage();
        await use(page);
        await context.close();
    },

    leaderPage: async ({ browser, playwright, baseURL }, use, testInfo) => {
        const options: BrowserContextOptions = {
            ...testInfo.project.use,
            storageState: path.resolve(process.cwd(), 'storage/auth/leader.json'),
            baseURL: baseURL
        };

        const context = await browser.newContext(options);
        await applyEnterpriseContextSettings(context, testInfo);

        const page = await context.newPage();
        await use(page);
        await context.close();
    },
});

export { expect } from './base.fixture';
