import { test, expect } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { MemberHelper } from '../../../lib/helpers/MemberHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { Logger } from '../../../lib/utils/Logger';
import { ROUTE_PATHS } from '../../../config/urls';
import { ENV } from '../../../config/env';
import { UI_CONSTANTS } from '../../../lib/data/constants/ui-constants';

/**
 * Member Journey Refinement
 * ------------------------
 * This spec handles the complete end-to-end lifecycle for the Support Member persona.
 * 
 * DESIGN PRINCIPLES:
 * 1. Journey Architecture: Single test() block per journey using granular test.step().
 * 2. Robustness: Uses centralized MemberHelper for logic reuse.
 * 3. Visibility: High-quality traces and videos generated for the entire flow.
 */
test.describe('Member E2E Journeys', { tag: ['@smoke', '@member'] }, () => {

    test('Member Journey: Registration -> Onboarding (CONTINUE) -> Dashboard', async ({ page, context }) => {
        const email = DataGenerator.email();

        await test.step('MEMBER-01: Registration - Fresh account creation', async () => {
            await MemberHelper.submitRegistrationForm(page, email);
        });

        await test.step('MEMBER-02: Registration - OTP Email Verification', async () => {
            await MemberHelper.verifyEmailWithOTP(page, context, email);
        });

        await test.step('MEMBER-03: Welcome - Role Selection (Member)', async () => {
            await MemberHelper.selectRoleAndContinue(page);
        });

        await test.step('MEMBER-04: Onboarding - Complete multi-step CONTINUE path', async () => {
            await MemberHelper.completeOnboardingViaContinue(page);
        });

        await test.step('MEMBER-05: Dashboard - Verify successful landing', async () => {
            await AssertionHelper.verifyDashboardLoaded(page);
            await MemberHelper.verifyDashboard(page);
            Logger.success('Member CONTINUE journey completed successfully');
        });
    });

    test('Member Journey: Registration -> Onboarding (SKIP) -> Dashboard', async ({ page, context }) => {
        const email = DataGenerator.email();

        await test.step('MEMBER-01: Registration - Fresh account creation', async () => {
            await MemberHelper.submitRegistrationForm(page, email);
        });

        await test.step('MEMBER-02: Registration - OTP Email Verification', async () => {
            await MemberHelper.verifyEmailWithOTP(page, context, email);
        });

        await test.step('MEMBER-03: Welcome - Role Selection (Member)', async () => {
            await MemberHelper.selectRoleAndContinue(page);
        });

        await test.step('MEMBER-04: Onboarding - Complete via SKIP path', async () => {
            await MemberHelper.completeOnboardingViaSkip(page);
        });

        await test.step('MEMBER-05: Dashboard - Verify successful landing', async () => {
            await AssertionHelper.verifyDashboardLoaded(page);
            await MemberHelper.verifyDashboard(page);

            // Extra: verify stability after reload
            await page.reload();
            await AssertionHelper.verifyDashboardLoaded(page);
            Logger.success('Member SKIP journey completed successfully');
        });
    });

    test('Security Check: Unauthenticated Member Access Redirect', async ({ page }) => {
        Logger.step('Attempting to access member protected routes without session');
        
        const PROTECTED_ROUTES = [ROUTE_PATHS.DASHBOARD, ROUTE_PATHS.PROFILE];
        
        for (const path of PROTECTED_ROUTES) {
            Logger.info(`Checking path: ${path}`);
            await page.goto(`${ENV.BASE_URL}${path}`);
            
            // Verify redirection to login
            await expect(page).toHaveURL(/.*\/login/);
            Logger.success(`Successfully redirected from ${path} to login`);
        }
    });

    test('Onboarding Integrity: State Persistence on Refresh', async ({ page, context }) => {
        const email = DataGenerator.generateEmail();
        
        await test.step('Step 1: Register and reach Welcome screen', async () => {
            await MemberHelper.registerNewMember(page, context, email);
            await MemberHelper.selectRoleAndContinue(page);
        });

        await test.step('Step 2: Verify state persists after refresh on Onboarding', async () => {
            Logger.step('Refreshing page at the start of onboarding to check persistence');
            
            // Wait for onboarding indicator
            await expect(page.getByText(new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.MEMBER_INTRO, 'i'))).toBeVisible({ timeout: 20000 });
            
            await page.reload();
            
            // Should still be on onboarding, not kicked back to welcome or login
            await expect(page.getByText(new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.MEMBER_INTRO, 'i'))).toBeVisible({ timeout: 20000 });
            Logger.success('Onboarding state persisted after refresh');
        });
    });
});
