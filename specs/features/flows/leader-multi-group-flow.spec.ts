import { test, expect } from '../../../lib/fixtures/index';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { WelcomePage } from '../../../lib/pages/auth/WelcomePage';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';
import { StripePage } from '../../../lib/pages/payment/StripePage';
import { PaymentSuccessPopup } from '../../../lib/pages/payment/PaymentSuccessPopup';
import { VerificationService } from '../../../lib/utils/VerificationService';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { ROUTE_PATHS } from '../../../config/urls';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { MESSAGES } from '../../../lib/data/constants/messages';

test.describe.serial('Leader Flow - Multi-Group Subscription', { tag: ['@smoke', '@leader'] }, () => {
    let context: any;
    let page: any;
    let email: string;
    let otp: string;

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
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('Step 1: Registration - Create new leader account', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-01' });
        const registrationPage = new RegistrationPage(page);
        await registrationPage.goto();
        await registrationPage.fillRegistrationForm({
            firstName: DataGenerator.firstName(),
            lastName: DataGenerator.lastName(),
            email: email,
            password: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT
        });
        await registrationPage.clickCreateAccount();
        await expect(page).toHaveURL(new RegExp(ROUTE_PATHS.VERIFY_EMAIL));
        // Pixel Perfect: Confirm OTP page rendered before proceeding 
        await registrationPage.waitForOTPPage();
    });

    test('Step 2: Registration - Verify email via OTP', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-02' });
        otp = await VerificationService.getOTP(page, email);

        // Bring main page to front after multi-tab operation
        await page.bringToFront();

        const registrationPage = new RegistrationPage(page);
        await registrationPage.verifyEmailWithOTP(otp);
        // Verify via Toast Message per user instruction (instead of URL)
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));
    });

    test('Step 3: Welcome - Select leader role', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-03' });
        const welcomePage = new WelcomePage(page);
        await welcomePage.selectGroupLeader();
        await welcomePage.clickContinue();
    });

    test('Step 4: Onboarding - Skip to Hosting Plan', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-04' });
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.completeLeaderOnboardingViaSkip();
    });

    test('Step 5: Hosting Plan - Select Multi-Group plan ($49)', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-05' });
        const hostingPlanPage = new HostingPlanPage(page);
        await hostingPlanPage.selectMultiGroupPlan();
        await hostingPlanPage.clickPayNow();
    });

    test('Step 6: Payment - Verify Stripe form loads', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-06' });
        const stripePage = new StripePage(page);
        await stripePage.verifyStripeFormVisible();
    });

    test('Step 7: Payment - Fill payment details', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-07' });
        const stripePage = new StripePage(page);
        await stripePage.fillPaymentDetails();
    });

    test('Step 8: Payment - Submit and verify success popup', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-08' });
        const stripePage = new StripePage(page);
        await stripePage.submitPayment();
        const successPopup = new PaymentSuccessPopup(page);
        await successPopup.verifyVisible();
    });

    test('Step 9: Payment Success - Dismiss popup and verify Dashboard', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LMG-09' });
        const successPopup = new PaymentSuccessPopup(page);
        await successPopup.clickDoThisLater();
        await expect(page).toHaveURL(/.*\/groups\/?$/);
    });
});
