import { test } from '../../../lib/fixtures/index';
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
test.describe.serial('Pixel Perfect Lifecycle Flow @smoke @critical @leader @e2e', () => {
    let context: any;
    let page: any;
    let email: string;
    let groupName: string;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        email = DataGenerator.email();
        groupName = DataGenerator.generateGroupName();
    });

    test.afterAll(async () => {
        await context.close();
    });

    // --- PHASE 1: AUTHENTICATION ---

    test('LIFECYCLE-01: Registration - Fresh account creation', async () => {
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

    test('LIFECYCLE-02: OTP Verification', async () => {
        const otp = await VerificationService.getOTP(page, email);

        await page.bringToFront();
        const registrationPage = new RegistrationPage(page);
        await registrationPage.verifyEmailWithOTP(otp);
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));
    });

    // --- PHASE 2: ONBOARDING ---

    test('LIFECYCLE-03: Welcome Screen - Role Selection (Leader)', async () => {
        await LeaderHelper.selectRoleAndContinue(page);
    });

    test('LIFECYCLE-04: Multi-step Onboarding - Full Journey CONTINUE path', async () => {
        await LeaderHelper.completeOnboardingViaContinue(page);
    });

    // --- PHASE 3: PRICING & PAYMENT ---

    test('LIFECYCLE-05: Hosting Plan Selection', async () => {
        await PaymentHelper.selectActivePlanAndProceed(page);
    });

    test('LIFECYCLE-06: Stripe Checkout Transaction', async () => {
        await PaymentHelper.fillStripeAndPay(page);
    });

    test('LIFECYCLE-07: Payment Success & Transition to Dashboard', async () => {
        await PaymentHelper.verifySuccessAndContinue(page);
        await LeaderHelper.verifyDashboard(page);
    });

    // --- PHASE 4: FEATURE USAGE ---

    test('LIFECYCLE-08: Functional Usage - Create First Group', async () => {
        await GroupHelper.createGroup(page, groupName);
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.GROUPS.CREATED_SUCCESS, 'i'));
        Logger.success(`Full Gold Standard Cycle Complete: Group "${groupName}" created.`);
    });
});
