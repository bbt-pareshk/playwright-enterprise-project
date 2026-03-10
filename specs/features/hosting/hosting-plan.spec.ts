import { test, expect } from '../../../lib/fixtures/index';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';

test.describe('Hosting Plan Selection', { tag: ['@smoke', '@leader'] }, () => {

    test.beforeEach(async ({ leaderPage }) => {
        // Staging can be slow on hosting plan page
        test.setTimeout(60_000);
        const hostingPage = new HostingPlanPage(leaderPage);
        await hostingPage.goto();
    });

    test('Hosting-plan page loads for authenticated leader', async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await hostingPage.verifyPageLoaded();
    });

    test('Free plan (Group Listing) card is visible', async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await hostingPage.verifyPageLoaded(); // Already verifies Free card
    });

    test('Active Group ($19/month) card is visible', async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await expect(hostingPage.activePlanButton).toBeVisible();
        await expect(leaderPage.getByText('$19')).toBeVisible();
    });

    test('Multi-Group/Org ($49/month) card is visible', async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await expect(hostingPage.multiGroupPlanButton).toBeVisible();
        await expect(leaderPage.getByText('$49')).toBeVisible();
    });

    test('"Get Group Listing" CTA on Free plan is clickable', async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await expect(hostingPage.freePlanButton).toBeEnabled();
    });

    test('Clicking "Get Group Listing" shows Free group popup', async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await hostingPage.selectFreePlan();

        // Verify modal/popup appears after clicking free plan CTA
        // ⚠️ Note: The button INSIDE the popup may still say 'Go to Group' (different from the CTA on the plan page)
        // Popup button text is unverified — see HANDOVER_SUMMARY.md Task 3 if this test fails
        const modal = leaderPage.locator('.chakra-modal__content, section[role="dialog"]').first();
        await expect(modal).toBeVisible();
    });
});
