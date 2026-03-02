import { test, expect } from '../../../lib/fixtures/index';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { WelcomePage } from '../../../lib/pages/auth/WelcomePage';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';
import { FreeGroupPopup } from '../../../lib/pages/hosting/FreeGroupPopup';
import { MailinatorPage } from '../../../lib/pages/utils/MailinatorPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { ROUTE_PATHS } from '../../../config/urls';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { MESSAGES } from '../../../lib/data/constants/messages';

test.describe.serial('Leader Full Flow - Free Plan @smoke @critical @leader @e2e', () => {
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

    test('TC-LFF-01: Register new Leader (fresh email)', async () => {
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
        // Confirm OTP pin inputs are rendered — proves the registration email was actually sent.
        // If this fails here, it means registration didn't go through (not an OTP issue).
        await registrationPage.waitForOTPPage();
    });

    test('TC-LFF-02: Verify email via Mailinator OTP', async () => {
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

    test('TC-LFF-03: Welcome page -> Click "Continue as a Group Leader"', async () => {
        const welcomePage = new WelcomePage(page);
        // Onboarding stays on /welcome, so no need to assert a URL change here
        await welcomePage.selectGroupLeader();
        await welcomePage.clickContinue();
    });

    test('TC-LFF-04: Onboarding step 2 -> Click Continue', async () => {
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.clickContinue(); // Intro screen
        await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
    });

    test('TC-LFF-05: Onboarding step 3 -> Click Skip', async () => {
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.clickSkip(); // Fast track to hosting plan
        await expect(page).toHaveURL(new RegExp(ROUTE_PATHS.HOSTING_PLAN), { timeout: 15000 });
    });

    test('TC-LFF-06: Hosting-plan page -> Click "Get Group Listing" (Free)', async () => {
        const hostingPage = new HostingPlanPage(page);
        await hostingPage.selectFreePlan();
        // DOM-verified: 'Get Group Listing' button triggers free plan flow
        // If modal appears: FreeGroupPopup should be visible
        const freePopup = new FreeGroupPopup(page);
        await freePopup.verifyVisible();
    });

    test('TC-LFF-07: Free group popup -> Click "Go to Groups"', async () => {
        const freePopup = new FreeGroupPopup(page);
        await freePopup.verifyVisible();
        await freePopup.clickGoToGroup();
        await expect(page).toHaveURL(/.*\/groups.*/);
    });
});
