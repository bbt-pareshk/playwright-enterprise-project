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
test.describe.serial('Pixel Perfect Lifecycle Flow', { tag: ['@smoke', '@leader'] }, () => {
    let context: any;
    let page: any;
    let email: string;
    let groupName: string;

    test.beforeAll(async ({ browser }, testInfo) => {
        const use = testInfo.project.use;
        context = await browser.newContext({
            ...use,
            // Only recordVideo needs explicit mapping — Playwright auto-manages tracing in test hooks
            ...(use.video && use.video !== 'off'
                ? { recordVideo: { dir: testInfo.outputPath('videos') } }
                : {}),
        });
        page = await context.newPage();
        email = DataGenerator.email();
        groupName = DataGenerator.generateGroupName();
    });

    test.afterAll(async () => {
        await context.close();
    });

    // --- PHASE 1: AUTHENTICATION ---

    test('Step 1: Registration - Create fresh account', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'LIFECYCLE-01' });
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

    test('Step 2: Registration - Verify OTP email', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'LIFECYCLE-02' });
        const otp = await VerificationService.getOTP(page, email);

        await page.bringToFront();
        const registrationPage = new RegistrationPage(page);
        await registrationPage.verifyEmailWithOTP(otp);
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));
    });

    // --- PHASE 2: ONBOARDING ---

    test('Step 3: Welcome - Select leader role', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'LIFECYCLE-03' });
        await LeaderHelper.selectRoleAndContinue(page);
    });

    test('Step 4: Onboarding - Complete full CONTINUE path', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'LIFECYCLE-04' });
        await LeaderHelper.completeOnboardingViaContinue(page);
    });

    // --- PHASE 3: PRICING & PAYMENT ---

    test('Step 5: Hosting Plan - Select Active plan', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'LIFECYCLE-05' });
        await PaymentHelper.selectActivePlanAndProceed(page);
    });

    test('Step 6: Payment - Complete Stripe checkout', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'LIFECYCLE-06' });
        await PaymentHelper.fillStripeAndPay(page);
    });

    test('Step 7: Payment Success - Dismiss popup and verify Dashboard', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'LIFECYCLE-07' });
        await PaymentHelper.verifySuccessAndContinue(page);
        await LeaderHelper.verifyDashboard(page);
    });

    // --- PHASE 4: FEATURE USAGE ---

    test('Step 8: Group - Create first group and verify success', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'LIFECYCLE-08' });
        await GroupHelper.createGroup(page, groupName);
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.GROUPS.CREATED_SUCCESS, 'i'));
        Logger.success(`Full Gold Standard Cycle Complete: Group "${groupName}" created.`);
    });
});
