import { test, expect } from '../../../lib/fixtures/index';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { WelcomePage } from '../../../lib/pages/auth/WelcomePage';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { MailinatorPage } from '../../../lib/pages/utils/MailinatorPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { ROUTE_PATHS } from '../../../config/urls';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { MESSAGES } from '../../../lib/data/constants/messages';

test.describe.serial('Member Full Flow - Explore Support Groups @smoke @critical @member @e2e', () => {
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

    test('TC-MFL-01: Register new Member (fresh email)', async () => {
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

    test('TC-MFL-02: Verify email via Mailinator OTP', async () => {
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

    test('TC-MFL-03: Welcome page -> "Explore support groups"', async () => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.selectExploreSupportGroups();
        await welcomePage.clickContinue();
    });

    test('TC-MFL-04: Onboarding -> Complete Member Flow via Skip', async () => {
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.completeMemberOnboardingViaSkip();
        await expect(page).toHaveURL(/.*\/groups.*/);
    });

    test('TC-MFL-05: Step complete -> Dashboard (/groups) loads', async () => {
        await expect(page).toHaveURL(/.*\/groups.*/, { timeout: 15000 });
        // Verify key dashboard elements using a more robust check
        await expect(page.getByRole('heading', { name: /Support Groups/i }).or(page.getByText(/Explore Groups/i)).first()).toBeVisible({ timeout: 15000 });
    });

    test('TC-MFL-06: Verify key dashboard elements visible', async () => {
        await expect(page.getByRole('heading', { name: /Support Groups/i }).or(page.getByRole('button', { name: /find a support group/i })).first()).toBeVisible();
    });
});
