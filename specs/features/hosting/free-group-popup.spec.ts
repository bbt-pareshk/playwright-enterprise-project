import { test, expect } from '../../../lib/fixtures/index';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';
import { FreeGroupPopup } from '../../../lib/pages/hosting/FreeGroupPopup';

test.describe('Free Group Confirmation Popup', () => {

    test.beforeEach(async ({ leaderPage }) => {
        const hostingPage = new HostingPlanPage(leaderPage);
        await hostingPage.goto();
        // DOM-verified (2026-02-24): CTA is 'Get Group Listing', not 'Go to Group'
        await hostingPage.selectFreePlan();
    });

    // ⚠️ Note: The popup INSIDE the modal may have a 'Go to Group' button (unverified)
    //    The free plan CTA on the plan PAGE is 'Get Group Listing' (verified)
    //    If these tests fail, run capture_hosting_plan.spec.ts to capture the popup DOM

    test('TC-FGP-01: Free group popup appears after "Get Group Listing" click @smoke @leader', async ({ leaderPage }) => {
        const freePopup = new FreeGroupPopup(leaderPage);
        await freePopup.verifyVisible();
    });

    test('TC-FGP-02: Popup modal container is visible @smoke @leader', async ({ leaderPage }) => {
        const modal = leaderPage.locator('.chakra-modal__content, section[role="dialog"]').first();
        await expect(modal).toBeVisible();
        // DOM-verified (2026-03-02): The exact button text inside the popup is now 'Create Your Group'
        await expect(modal.getByRole('button', { name: 'Create Your Group', exact: true })).toBeVisible();
    });

    test('TC-FGP-03: Clicking popup CTA proceeds to /groups @regression @leader', async ({ leaderPage }) => {
        const freePopup = new FreeGroupPopup(leaderPage);
        await freePopup.clickGoToGroup();

        // After clicking, should redirect to dashboard/group page
        // After clicking, should redirect to either the Dashboard or the Group Creation flow
        await expect(leaderPage).toHaveURL(/.*\/groups(\/create)?$/);
    });
});
