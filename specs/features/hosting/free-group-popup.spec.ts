import { test, expect } from '../../../lib/fixtures/index';
import { Page, BrowserContext } from '@playwright/test';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';
import { FreeGroupPopup } from '../../../lib/pages/hosting/FreeGroupPopup';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { applyEnterpriseContextSettings } from '../../../lib/fixtures/base.fixture';

test.describe.serial('Free Group Confirmation Popup', { tag: ['@smoke', '@leader'] }, () => {
    let sharedPage: Page;
    let sharedContext: BrowserContext;

    test.beforeAll(async ({ browser }, testInfo) => {
        // Multi-page enterprise flow needs more time
        test.setTimeout(120_000);

        sharedContext = await browser.newContext();
        // Manually apply enterprise stability settings to the shared context
        await applyEnterpriseContextSettings(sharedContext, testInfo);
        
        sharedPage = await sharedContext.newPage();

        // Step 1: Register a fresh leader to ensure Hosting Plan buttons are enabled
        const email = DataGenerator.generateEmail();
        await LeaderHelper.registerNewLeader(sharedPage, sharedContext, email);
        await LeaderHelper.selectRoleAndContinue(sharedPage);

        // CRITICAL: Must skip onboarding to reach the hosting plan page
        await LeaderHelper.completeOnboardingViaSkip(sharedPage);

        // Step 2: Navigate to hosting page and ensure it is fully established
        const hostingPage = new HostingPlanPage(sharedPage);
        await hostingPage.goto();
        await hostingPage.verifyPageLoaded();
        
        // Step 3: Trigger the popup
        await hostingPage.selectFreePlan();
    });

    test.afterAll(async () => {
        await sharedPage.close();
        await sharedContext.close();
    });

    test('Free group popup appears after "Get Group Listing" click', async () => {
        const freePopup = new FreeGroupPopup(sharedPage);
        await freePopup.verifyVisible();
    });

    test('Popup modal container is visible', async () => {
        const modal = sharedPage.locator('.chakra-modal__content, section[role="dialog"]').first();
        await expect(modal).toBeVisible();
        // DOM-verified (2026-03-02): The exact button text inside the popup is now 'Create Your Group'
        await expect(modal.getByRole('button', { name: 'Create Your Group', exact: true })).toBeVisible();
    });

    test('Clicking popup CTA proceeds to dashboard', async () => {
        const freePopup = new FreeGroupPopup(sharedPage);
        await freePopup.clickGoToGroup();

        // After clicking, should redirect to dashboard/group page
        // After clicking, should redirect to either the Dashboard or the Group Creation flow
        await expect(sharedPage).toHaveURL(/.*\/groups(\/create)?$/);
    });
});
