import { test, expect } from '../../../lib/fixtures/index';
import { Page, BrowserContext } from '@playwright/test';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { DataGenerator } from '../../../lib/utils/DataGenerator';

test.describe.serial('Hosting Plan Selection', { tag: ['@smoke', '@leader'] }, () => {
    let sharedPage: Page;
    let sharedContext: BrowserContext;

    test.beforeAll(async ({ browser }) => {
        // Staging can be slow on hosting plan page
        test.setTimeout(120_000);

        sharedContext = await browser.newContext();
        sharedPage = await sharedContext.newPage();

        // Step 1: Register a fresh leader to ensure Hosting Plan buttons are enabled
        const email = DataGenerator.generateEmail();
        await LeaderHelper.registerNewLeader(sharedPage, sharedContext, email);
        await LeaderHelper.selectRoleAndContinue(sharedPage);

        // Step 2: Clear Onboarding to reach Hosting Page
        await LeaderHelper.completeOnboardingViaSkip(sharedPage);

        // Step 3: Land on target page and verify integrity
        const hostingPage = new HostingPlanPage(sharedPage);
        await hostingPage.goto();
        await hostingPage.verifyPageLoaded();
    });

    test.afterAll(async () => {
        if (sharedPage) await sharedPage.close();
        if (sharedContext) await sharedContext.close();
    });

    test('Hosting-plan page loads for authenticated leader', async () => {
        const hostingPage = new HostingPlanPage(sharedPage);
        await hostingPage.verifyPageLoaded();
    });

    test('Free plan (Group Listing) card is visible', async () => {
        const hostingPage = new HostingPlanPage(sharedPage);
        // Already verified as part of verifyPageLoaded() in beforeAll/Load test
        await expect(hostingPage.freePlanButton).toBeVisible();
    });

    test('Active Group ($19/month) card is visible', async () => {
        const hostingPage = new HostingPlanPage(sharedPage);
        await expect(hostingPage.activePlanButton).toBeVisible();
        await expect(sharedPage.getByText('$19')).toBeVisible();
    });

    test('Multi-Group/Org ($49/month) card is visible', async () => {
        const hostingPage = new HostingPlanPage(sharedPage);
        await expect(hostingPage.multiGroupPlanButton).toBeVisible();
        await expect(sharedPage.getByText('$49')).toBeVisible();
    });

    test('"Get Group Listing" CTA on Free plan is clickable', async () => {
        const hostingPage = new HostingPlanPage(sharedPage);
        await expect(hostingPage.freePlanButton).toBeEnabled();
    });

    test('Clicking "Get Group Listing" shows Free group popup', async () => {
        const hostingPage = new HostingPlanPage(sharedPage);
        await hostingPage.selectFreePlan();

        // Verify modal/popup appears after clicking free plan CTA
        const modal = sharedPage.locator('.chakra-modal__content, section[role="dialog"]').first();
        await expect(modal).toBeVisible();
    });
});
