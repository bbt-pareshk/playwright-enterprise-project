import { test, expect } from '../../../lib/fixtures/index';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { WelcomePage } from '../../../lib/pages/auth/WelcomePage';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';
import { StripePage } from '../../../lib/pages/payment/StripePage';
import { PaymentSuccessPopup } from '../../../lib/pages/payment/PaymentSuccessPopup';
import { MailinatorPage } from '../../../lib/pages/utils/MailinatorPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { ROUTE_PATHS } from '../../../config/urls';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { MESSAGES } from '../../../lib/data/constants/messages';

test.describe.serial('Leader Full Flow - Multi-Group ($49) @smoke @critical @leader @e2e', () => {
    let context: any;
    let page: any;
    let email: string;
    let otp: string;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        email = DataGenerator.email();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('TC-LMG-01: Register new Leader (fresh email)', async () => {
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

    test('TC-LMG-02: Verify email via Mailinator OTP', async () => {
        const mailinatorTab = await context.newPage();
        const mailinator = new MailinatorPage(mailinatorTab);
        otp = await mailinator.getOTPFromEmail(email);
        await mailinatorTab.close();

        // Bring main page to front after multi-tab operation
        await page.bringToFront();

        const registrationPage = new RegistrationPage(page);
        await registrationPage.verifyEmailWithOTP(otp);
        // Verify via Toast Message per user instruction (instead of URL)
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));
    });

    test('TC-LMG-03: Welcome page -> "Continue as a Group Leader"', async () => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.selectGroupLeader();
        await welcomePage.clickContinue();
    });

    test('TC-LMG-04: Onboarding -> Skip to hosting-plan', async () => {
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.completeLeaderOnboardingViaSkip();
    });

    test('TC-LMG-05: Hosting-plan -> Click "Get Multi-Group" ($49)', async () => {
        const hostingPlanPage = new HostingPlanPage(page);
        await hostingPlanPage.selectMultiGroupPlan();
        await hostingPlanPage.clickPayNow();
    });

    test('TC-LMG-06: Payment page loads', async () => {
        const stripePage = new StripePage(page);
        await stripePage.verifyStripeFormVisible();
    });

    test('TC-LMG-07: Fill payment details', async () => {
        const stripePage = new StripePage(page);
        await stripePage.fillPaymentDetails();
    });

    test('TC-LMG-08: Submit payment -> Success popup', async () => {
        const stripePage = new StripePage(page);
        await stripePage.submitPayment();
        const successPopup = new PaymentSuccessPopup(page);
        await successPopup.verifyVisible();
    });

    test('TC-LMG-09: Success popup -> Dashboard loads', async () => {
        const successPopup = new PaymentSuccessPopup(page);
        await successPopup.clickDoThisLater();
        await expect(page).toHaveURL(/.*\/groups\/?$/);
    });
});
