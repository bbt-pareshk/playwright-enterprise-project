import { test } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { MemberHelper } from '../../../lib/helpers/MemberHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Member Full Flow - Explore Support Groups
 * -----------------------------------------
 * This spec validates the granular steps of the support member journey.
 * It uses the centralized MemberHelper and expands to 7 granular tests.
 */
test.describe.serial('Member Full Flow - Explore Support Groups @smoke @critical @member @e2e', () => {
    let context: any;
    let page: any;
    let email: string;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        email = DataGenerator.email();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('TC-MFF-01: Member Registration - Form Submission', async () => {
        Logger.info('Step 1: Registration Form');
        await MemberHelper.submitRegistrationForm(page, email);
    });

    test('TC-MFF-02: Member Registration - OTP Email Verification', async () => {
        Logger.info('Step 2: OTP Verification');
        await MemberHelper.verifyEmailWithOTP(page, context, email);
    });

    test('TC-MFF-03: Welcome page -> Role Selection', async () => {
        Logger.info('Step 3: Role Selection');
        await MemberHelper.selectRoleAndContinue(page);
    });

    test('TC-MFF-04: Onboarding Journey -> Complete via Skip Path', async () => {
        Logger.info('Step 4: Onboarding');
        await MemberHelper.completeOnboardingViaSkip(page);
    });

    test('TC-MFF-05: Transaction Success -> Dashboard URL Validation', async () => {
        Logger.info('Step 5: URL Validation');
        await AssertionHelper.verifyDashboardLoaded(page);
    });

    test('TC-MFF-06: Dashboard UI Check -> Key Elements Visibility', async () => {
        Logger.info('Step 6: Content Validation');
        await MemberHelper.verifyDashboard(page);
    });

    test('TC-MFF-07: Final Flow Verification -> User Session Stability', async () => {
        Logger.info('Step 7: Session Stability');
        // Final check: refresh and ensure still on dashboard
        await page.reload();
        await AssertionHelper.verifyDashboardLoaded(page);
        Logger.success('Member Full Flow (7 steps) completed successfully');
    });
});
