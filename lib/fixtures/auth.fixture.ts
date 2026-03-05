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
        const projectUse = testInfo.project.use;

        // Inherit global context options (viewport, timeouts, etc.)
        const options: BrowserContextOptions = {
            ...projectUse,
            storageState: path.resolve(process.cwd(), 'storage/auth/member.json'),
            baseURL: baseURL
        };

        // Manual contexts need explicit recordVideo settings
        if (projectUse.video && projectUse.video !== 'off') {
            options.recordVideo = {
                dir: testInfo.outputPath('videos')
            };
        }

        const context = await browser.newContext(options);

        // Start tracing manually for isolated context
        if (projectUse.trace && projectUse.trace !== 'off') {
            await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
        }

        await applyEnterpriseContextSettings(context, testInfo);

        const page = await context.newPage();
        await use(page);

        // Handle Trace retention on final context
        if (projectUse.trace && projectUse.trace !== 'off') {
            const isFailed = testInfo.status !== testInfo.expectedStatus;
            const shouldRetain = projectUse.trace === 'on' || (projectUse.trace === 'retain-on-failure' && isFailed);
            await context.tracing.stop({ path: shouldRetain ? testInfo.outputPath('trace.zip') : undefined });
        }

        await context.close();
    },

    leaderPage: async ({ browser, playwright, baseURL }, use, testInfo) => {
        const projectUse = testInfo.project.use;

        const options: BrowserContextOptions = {
            ...projectUse,
            storageState: path.resolve(process.cwd(), 'storage/auth/leader.json'),
            baseURL: baseURL
        };

        if (projectUse.video && projectUse.video !== 'off') {
            options.recordVideo = {
                dir: testInfo.outputPath('videos')
            };
        }

        const context = await browser.newContext(options);

        if (projectUse.trace && projectUse.trace !== 'off') {
            await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
        }

        await applyEnterpriseContextSettings(context, testInfo);

        const page = await context.newPage();
        await use(page);

        if (projectUse.trace && projectUse.trace !== 'off') {
            const isFailed = testInfo.status !== testInfo.expectedStatus;
            const shouldRetain = projectUse.trace === 'on' || (projectUse.trace === 'retain-on-failure' && isFailed);
            await context.tracing.stop({ path: shouldRetain ? testInfo.outputPath('trace.zip') : undefined });
        }

        await context.close();
    },
});

export { expect } from './base.fixture';
