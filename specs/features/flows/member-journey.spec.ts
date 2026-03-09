import { test } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { MemberHelper } from '../../../lib/helpers/MemberHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { Logger } from '../../../lib/utils/Logger';

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
});
