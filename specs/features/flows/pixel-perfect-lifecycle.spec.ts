import { test, expect } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { PaymentHelper } from '../../../lib/helpers/PaymentHelper';
import { GroupHelper } from '../../../lib/helpers/GroupHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { VerificationService } from '../../../lib/utils/VerificationService';
import { MESSAGES } from '../../../lib/data/constants/messages';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Pixel Perfect Lifecycle Flow
 * ----------------------------
 * This is the ultimate "Gold Standard" E2E test covering the entire user journey:
 * Registration -> OTP -> Role Selection -> Onboarding -> Pricing -> Payment -> Dashboard -> Feature Usage.
 *
 * It uses the centralized LeaderHelper and PaymentHelper for robustness and maintainability.
 * Standardized to 8 granular steps for maximum visibility and coverage.
 */
test.describe('Pixel Perfect Lifecycle Flow', { tag: ['@smoke', '@leader'] }, () => {

    test('Pixel Perfect Lifecycle Flow Journey', async ({ page, context }, testInfo) => {
        // Expand timeout since this single test runs the entire E2E journey
        test.setTimeout(180_000);
        const email = DataGenerator.email();
        const groupName = DataGenerator.generateGroupName();

        // --- PHASE 1: AUTHENTICATION ---
        await test.step('LIFECYCLE-01: Registration - Create fresh account', async () => {
            const registrationPage = new RegistrationPage(page);
            await registrationPage.goto();
            await registrationPage.fillRegistrationForm({
                firstName: 'Pixel',
                lastName: 'Perfect',
                email: email,
                password: 'Password123!'
            });
            await registrationPage.clickCreateAccount();
            await registrationPage.waitForOTPPage();
        });

        await test.step('LIFECYCLE-02: Registration - Verify OTP email', async () => {
            const otp = await VerificationService.getOTP(page, email);

            await page.bringToFront();
            const registrationPage = new RegistrationPage(page);
            await registrationPage.verifyEmailWithOTP(otp);
            await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));
        });

        // --- PHASE 2: ONBOARDING ---
        await test.step('LIFECYCLE-03: Welcome - Select leader role', async () => {
            await LeaderHelper.selectRoleAndContinue(page);
        });

        await test.step('LIFECYCLE-04: Onboarding - Complete full CONTINUE path', async () => {
            await LeaderHelper.completeOnboardingViaContinue(page);
        });

        // --- PHASE 3: PRICING & PAYMENT ---
        await test.step('LIFECYCLE-05: Hosting Plan - Select Active plan', async () => {
            await PaymentHelper.selectActivePlanAndProceed(page);
        });

        await test.step('LIFECYCLE-06: Payment - Complete Stripe checkout', async () => {
            await PaymentHelper.fillStripeAndPay(page);
        });

        await test.step('LIFECYCLE-07: Payment Success - Verify redirect to Group Creation', async () => {
            // Post-payment, the app now redirects directly to /groups/create (no popup).
            await PaymentHelper.verifySuccessAndContinue(page);
            // Confirm we landed on the group creation or groups section
            await expect(page).toHaveURL(/.*\/groups(\/create)?$/, { timeout: 15_000 });
            Logger.success('Payment succeeded and redirected to Group Creation flow');
        });

        // --- PHASE 4: FEATURE USAGE ---
        await test.step('LIFECYCLE-08: Group - Create first group and verify success', async () => {
            await GroupHelper.createGroup(page, groupName);
            // Verification: Ensure redirection to the new group's dashboard/listing
            await page.waitForURL(/.*\/groups\/.*/, { timeout: 15_000 });
            await page.getByText(groupName).first().waitFor({ state: 'visible' });
            Logger.success(`Full Gold Standard Cycle Complete: Group "${groupName}" created.`);
        });
    });
});

