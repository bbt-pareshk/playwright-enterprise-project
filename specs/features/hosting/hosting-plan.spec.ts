import { test, expect } from '../../../lib/fixtures/index';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';

test.describe('Hosting Plan Selection', () => {

    test.beforeEach(async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await hostingPage.goto();
    });

    test('TC-HST-01: Hosting-plan page loads for authenticated leader @smoke @critical @leader', async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await hostingPage.verifyPageLoaded();
    });

    // DOM-verified (2026-02-24): Free plan CTA is 'Get Group Listing' — not 'Go to Group'
    test('TC-HST-02: Free plan (Group Listing) card is visible @smoke @leader', async ({ leaderPage }) => {
        await expect(leaderPage.getByRole('button', { name: 'Get Group Listing', exact: true })).toBeVisible();
    });

    test('TC-HST-03: Active Group ($19/month) card is visible @smoke @leader', async ({ leaderPage }) => {
        await expect(leaderPage.getByRole('button', { name: 'Get Active Group', exact: true })).toBeVisible();
        await expect(leaderPage.getByText('$19')).toBeVisible();
    });

    test('TC-HST-04: Multi-Group/Org ($49/month) card is visible @smoke @leader', async ({ leaderPage }) => {
        await expect(leaderPage.getByRole('button', { name: 'Get Multi-Group', exact: true })).toBeVisible();
        await expect(leaderPage.getByText('$49')).toBeVisible();
    });

    // DOM-verified (2026-02-24): 'Get Group Listing' is the Free plan CTA on the hosting-plan page
    test('TC-HST-05: "Get Group Listing" CTA on Free plan is clickable @regression @leader', async ({ leaderPage }) => {
        const freeCta = leaderPage.getByRole('button', { name: 'Get Group Listing', exact: true });
        await expect(freeCta).toBeEnabled();
    });

    test('TC-HST-06: Clicking "Get Group Listing" shows Free group popup @regression @critical @leader', async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await hostingPage.selectFreePlan();

        // Verify modal/popup appears after clicking free plan CTA
        // ⚠️ Note: The button INSIDE the popup may still say 'Go to Group' (different from the CTA on the plan page)
        // Popup button text is unverified — see HANDOVER_SUMMARY.md Task 3 if this test fails
        const modal = leaderPage.locator('.chakra-modal__content, section[role="dialog"]').first();
        await expect(modal).toBeVisible();
    });
});
