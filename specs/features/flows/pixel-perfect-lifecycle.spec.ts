
import { test, expect } from '../../../lib/fixtures/index';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { WelcomePage } from '../../../lib/pages/auth/WelcomePage';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';
import { StripePage } from '../../../lib/pages/payment/StripePage';
import { PaymentSuccessPopup } from '../../../lib/pages/payment/PaymentSuccessPopup';
import { DashboardPage } from '../../../lib/pages/dashboard/DashboardPage';
import { CreateGroupPage } from '../../../lib/pages/group/CreateGroupPage';
import { MailinatorPage } from '../../../lib/pages/utils/MailinatorPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { ROUTE_PATHS } from '../../../config/urls';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { MESSAGES } from '../../../lib/data/constants/messages';
import { Logger } from '../../../lib/utils/Logger';
import { GroupHelper } from '../../../lib/helpers/GroupHelper';

/**
 * Pixel Perfect Lifecycle Flow
 * ----------------------------
 * This is the ultimate "Gold Standard" E2E test covering the entire user journey:
 * Registration -> OTP -> Role Selection -> Onboarding -> Pricing -> Payment -> Dashboard -> Feature Usage.
 */
test.describe.serial('Pixel Perfect Lifecycle Flow @smoke @critical @leader @e2e', () => {
    let context: any;
    let page: any;
    let email: string;
    let otp: string;
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
            firstName: DataGenerator.firstName(),
            lastName: DataGenerator.lastName(),
            email: email,
            password: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT
        });

        await registrationPage.clickCreateAccount();

        // Assert URL and element visibility for "Pixel Perfect" readiness
        await expect(page).toHaveURL(new RegExp(ROUTE_PATHS.VERIFY_EMAIL));
        await registrationPage.waitForOTPPage();
        Logger.success('Registration successful. OTP page ready.');
    });

    test('LIFECYCLE-02: OTP Verification via Mailinator', async () => {
        const mailinatorTab = await context.newPage();
        const mailinator = new MailinatorPage(mailinatorTab);

        otp = await mailinator.getOTPFromEmail(email);
        await mailinatorTab.close();

        // Bring main page to front and verify
        await page.bringToFront();

        const registrationPage = new RegistrationPage(page);
        await registrationPage.verifyEmailWithOTP(otp);

        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));
    });

    // --- PHASE 2: ONBOARDING ---

    test('LIFECYCLE-03: Welcome Screen - Role Selection (Leader)', async () => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.verifyPageLoaded();

        await welcomePage.selectGroupLeader();
        await welcomePage.clickContinue(); // Move to onboarding

        // Wait for onboarding content to appear (SPA transition might not change URL immediately)
        await expect(page.getByText(/Tell us a bit about your background/i)).toBeVisible({ timeout: 10000 });
    });

    test('LIFECYCLE-04: Multi-step Onboarding - Full Journey (Continue through all steps)', async () => {
        const onboardingPage = new OnboardingPage(page);

        // This helper clicks Continue 4 times: Intro, Step 1, Step 2, Step 3
        await onboardingPage.completeLeaderOnboardingViaContinue();

        await expect(page).toHaveURL(new RegExp(ROUTE_PATHS.HOSTING_PLAN));
        Logger.success('Onboarding completed. Pricing page loaded.');
    });

    // --- PHASE 3: PRICING & PAYMENT ---

    test('LIFECYCLE-05: Hosting Plan - Select Active Group ($19)', async () => {
        const hostingPlanPage = new HostingPlanPage(page);
        await hostingPlanPage.verifyPageLoaded();

        await hostingPlanPage.selectActivePlan();
        await hostingPlanPage.clickPayNow();

        Logger.success('Active plan selected. Proceeding to payment.');
    });

    test('LIFECYCLE-06: Stripe Checkout - Successful Transaction', async () => {
        const stripePage = new StripePage(page);
        await stripePage.verifyStripeFormVisible();

        await stripePage.fillPaymentDetails();
        await stripePage.submitPayment();

        const successPopup = new PaymentSuccessPopup(page);
        await successPopup.verifyVisible();
        Logger.success('Payment completed successfully.');
    });

    // --- PHASE 4: DASHBOARD & GROUP CREATION ---

    test('LIFECYCLE-07: Transition to Dashboard', async () => {
        const successPopup = new PaymentSuccessPopup(page);

        // Optional: The popup might have auto-dismissed or been skipped on fast redirect
        const isPopupVisible = await page.locator('.chakra-modal__content, section[role="dialog"]').isVisible({ timeout: 5000 }).catch(() => false);

        if (isPopupVisible) {
            await successPopup.clickDoThisLater();
        }

        await AssertionHelper.verifyDashboardLoaded(page);
        // Pixel Perfect: Wait for subscription status to sync for fresh account
        await page.waitForTimeout(5000);
        Logger.success('Arrived at Dashboard.');
    });

    test('LIFECYCLE-08: Functional Usage - Create First Group', async () => {
        await GroupHelper.createGroup(page, groupName);

        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.GROUPS.CREATED_SUCCESS, 'i'));
        Logger.success(`Cycle Complete: Group "${groupName}" created.`);
    });
});
