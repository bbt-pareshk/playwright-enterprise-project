
import { test, expect } from '../../../lib/fixtures/index';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { WelcomePage } from '../../../lib/pages/auth/WelcomePage';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { MailinatorPage } from '../../../lib/pages/utils/MailinatorPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { MESSAGES } from '../../../lib/data/constants/messages';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Member Lifecycle Flows
 * --------------------
 * High-value E2E tests for the Support Member persona.
 * Each test performs a fresh registration to ensure the Welcome Page and Onboarding flows are triggered correctly.
 */
test.describe('Member Lifecycle Flows @smoke @member @e2e', () => {

    test('MEMBER-LIFECYCLE-01: Full Journey - Registration to Member Dashboard (Continue Path)', async ({ page, context }) => {
        const email = DataGenerator.email();
        const registrationPage = new RegistrationPage(page);
        const welcomePage = new WelcomePage(page);
        const onboardingPage = new OnboardingPage(page);

        // 1. Registration
        await registrationPage.goto();
        await registrationPage.fillRegistrationForm({
            firstName: DataGenerator.firstName(),
            lastName: DataGenerator.lastName(),
            email: email,
            password: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT
        });
        await registrationPage.clickCreateAccount();

        // 2. OTP Verification
        const mailinatorTab = await context.newPage();
        const mailinator = new MailinatorPage(mailinatorTab);
        const otp = await mailinator.getOTPFromEmail(email);
        await mailinatorTab.close();

        await page.bringToFront();
        await registrationPage.verifyEmailWithOTP(otp);
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));

        // 3. Welcome Screen - Role Selection
        await welcomePage.verifyPageLoaded();
        await welcomePage.selectSupportGroupMember();
        await welcomePage.clickContinue();

        // Pixel Perfect: Wait for transition to onboarding
        await expect(page.getByText(/What kind of support are you looking for/i)).toBeVisible({ timeout: 20000 });

        // 4. Onboarding - Multi-step Continue
        await onboardingPage.completeMemberOnboardingViaContinue();

        // 5. Landing - Groups Dashboard
        await AssertionHelper.verifyDashboardLoaded(page);
        Logger.success('MEMBER-LIFECYCLE-01: COMPLETED SUCCESSFULLY');
    });

    test('MEMBER-LIFECYCLE-02: Full Journey - Registration to Member Dashboard (Skip Path)', async ({ page, context }) => {
        const email = DataGenerator.email();
        const registrationPage = new RegistrationPage(page);
        const welcomePage = new WelcomePage(page);
        const onboardingPage = new OnboardingPage(page);

        // 1. Registration
        await registrationPage.goto();
        await registrationPage.fillRegistrationForm({
            firstName: DataGenerator.firstName(),
            lastName: DataGenerator.lastName(),
            email: email,
            password: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT
        });
        await registrationPage.clickCreateAccount();

        // 2. OTP Verification
        const mailinatorTab = await context.newPage();
        const mailinator = new MailinatorPage(mailinatorTab);
        const otp = await mailinator.getOTPFromEmail(email);
        await mailinatorTab.close();

        await page.bringToFront();
        await registrationPage.verifyEmailWithOTP(otp);

        // 3. Welcome Screen - Role Selection
        await welcomePage.verifyPageLoaded();
        await welcomePage.selectSupportGroupMember();
        await welcomePage.clickContinue();

        // Pixel Perfect: Wait for transition to onboarding
        await expect(page.getByText(/What kind of support are you looking for/i)).toBeVisible({ timeout: 20000 });

        // 4. Onboarding - Skip
        await onboardingPage.completeMemberOnboardingViaSkip();

        // 5. Landing - Groups Dashboard
        await AssertionHelper.verifyDashboardLoaded(page);
        Logger.success('MEMBER-LIFECYCLE-02: COMPLETED SUCCESSFULLY');
    });
});
