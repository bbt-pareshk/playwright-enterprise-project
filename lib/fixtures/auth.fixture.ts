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

        await applyEnterpriseContextSettings(context, testInfo);

        const page = await context.newPage();
        await use(page);

        const video = page.video();
        await context.close();

        if (video && projectUse.video && projectUse.video !== 'off') {
            const isFailed = testInfo.status !== testInfo.expectedStatus;
            const shouldRetain = projectUse.video === 'on' || (projectUse.video === 'retain-on-failure' && isFailed);
            if (shouldRetain) {
                const videoPath = await video.path();
                await testInfo.attach('video', { path: videoPath, contentType: 'video/webm' });
            }
        }
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

        await applyEnterpriseContextSettings(context, testInfo);

        const page = await context.newPage();
        await use(page);

        const video = page.video();
        await context.close();

        if (video && projectUse.video && projectUse.video !== 'off') {
            const isFailed = testInfo.status !== testInfo.expectedStatus;
            const shouldRetain = projectUse.video === 'on' || (projectUse.video === 'retain-on-failure' && isFailed);
            if (shouldRetain) {
                const videoPath = await video.path();
                await testInfo.attach('video', { path: videoPath, contentType: 'video/webm' });
            }
        }
    },
});

export { expect } from './base.fixture';
