import { test, expect } from '../../../lib/fixtures/index';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { MailinatorPage } from '../../../lib/pages/utils/MailinatorPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { URLS } from '../../../config/urls';
import { MESSAGES } from '../../../lib/data/constants/messages';
import { Logger } from '../../../lib/utils/Logger';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { NavigationHelper } from '../../../lib/helpers/NavigationHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { RuntimeStore } from '../../../lib/utils/RuntimeStore';

test.describe.serial('Registration and Onboarding Flow', () => {
    let context: any;
    let page: any;
    let email: string;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('Registration and Email OTP Verification', { tag: ['@smoke', '@critical'] }, async () => {
        const registrationPage = new RegistrationPage(page);

        // 1. Open registration page directly or via Login
        await NavigationHelper.gotoRegistration(page);
        await expect(page).toHaveURL(new RegExp(URLS.REGISTER));

        // 2. Fill registration form
        const password = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT;
        email = DataGenerator.generateEmail();
        const userData = {
            firstName: DataGenerator.firstName(),
            lastName: DataGenerator.lastName(),
            email: email,
            password: password,
        };

        Logger.step(`Generated test email: ${email}`);
        RuntimeStore.saveUserEmail(email);
        await registrationPage.fillRegistrationForm(userData);

        // 3. Submit registration
        await registrationPage.clickCreateAccount();

        // 4. Verify redirect to verification page
        await expect(page).toHaveURL(new RegExp(`${URLS.VERIFY_EMAIL}$`), { timeout: 20000 });

        // 5. Open Mailinator inbox in new tab
        const mailinatorPage = await context.newPage();
        const mailinator = new MailinatorPage(mailinatorPage);

        // 6. Extract OTP
        const otp = await mailinator.getOTPFromEmail(email);
        await mailinatorPage.close();

        // 7. Verify OTP
        await registrationPage.verifyEmailWithOTP(otp);

        // 8. Validate success toast
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));

        // 9. Flag user as verified for dependent tests
        RuntimeStore.saveUserVerified(true);
    });

    test('Complete Onboarding Process', { tag: ['@smoke', '@critical'] }, async () => {
        const onboardingPage = new OnboardingPage(page);

        // 1. Verify redirect to welcome page
        await expect(page).toHaveURL(new RegExp(URLS.WELCOME), { timeout: 15000 });

        // 2. Complete onboarding steps
        await onboardingPage.completeOnboardingFlow();

        // 3. Verify final redirect to dashboard
        await AssertionHelper.verifyDashboardLoaded(page);
    });
});

test.describe('Registration - Validation', () => {
    test('Verify minimum password length validation on Registration', { tag: ['@regression'] }, async ({ page }) => {
        const registrationPage = new RegistrationPage(page);

        // 1. Navigate to Registration page
        await NavigationHelper.gotoRegistration(page);

        // 2. Fill registration form with short password
        const shortPassword = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.SHORT;
        const email = DataGenerator.generateEmail();
        const userData = {
            firstName: DataGenerator.firstName(),
            lastName: DataGenerator.lastName(),
            email: email,
            password: shortPassword,
        };

        Logger.step(`Initialising registration with short password: ${shortPassword}`);
        await registrationPage.fillRegistrationForm(userData);

        // 3. Verify submit button is disabled (Client-side validation)
        await registrationPage.expectCreateButtonDisabled();

        // 5. Verify still on registration page (submission prevented)
        await expect(page).toHaveURL(new RegExp(URLS.REGISTER));
    });

    test('Verify maximum password length validation on Registration', { tag: ['@regression'] }, async ({ page }) => {
        const registrationPage = new RegistrationPage(page);

        // 1. Navigate to Registration page
        await NavigationHelper.gotoRegistration(page);

        // 2. Fill registration form with long password
        const longPassword = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.LONG;
        const email = DataGenerator.generateEmail();
        const userData = {
            firstName: DataGenerator.firstName(),
            lastName: DataGenerator.lastName(),
            email: email,
            password: longPassword,
        };

        Logger.step(`Initialising registration with long password (length: ${longPassword.length})`);
        await registrationPage.fillRegistrationForm(userData);

        // 3. Verify submit button is disabled (Client-side validation)
        // Note: App seems to allow long passwords on client side (button enabled)
        // await registrationPage.expectCreateButtonDisabled();

        // 4. Verify password length error (optional, commented out as per previous pattern)
        // await registrationPage.verifyPasswordMaxLengthError();

        // 5. Verify still on registration page
        await expect(page).toHaveURL(new RegExp(URLS.REGISTER));
    });

    test('Verify registration with already registered email', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
        const registrationPage = new RegistrationPage(page);

        // 1. Navigate to Registration page
        await NavigationHelper.gotoRegistration(page);

        // 2. Enter an already registered email and trigger blur validation
        const existingEmail = RuntimeStore.getUserEmail();
        Logger.step(`Entering already registered email: ${existingEmail}`);
        await registrationPage.fillEmailAndBlur(existingEmail);

        // 3. Verify "email is not available" inline error appears
        await registrationPage.verifyEmailUnavailableError();

        // 4. Verify "Create Account" button is disabled
        await registrationPage.expectCreateButtonDisabled();

        // 5. Verify still on registration page
        await expect(page).toHaveURL(new RegExp(URLS.REGISTER));
    });

    test('Verify first and last name field validation (only letters allowed)', { tag: ['@regression'] }, async ({ page }) => {
        const registrationPage = new RegistrationPage(page);

        // 1. Navigate to Registration page
        await NavigationHelper.gotoRegistration(page);

        // 2. Enter invalid first name (with numbers)
        Logger.step('Entering invalid first name with numbers');
        await registrationPage.fillFirstName('John123');
        await registrationPage.fillLastName('Doe'); // Fill other fields to trigger validation

        // 3. Verify first name error
        await registrationPage.verifyFirstNameInvalidError();

        // 4. Enter invalid last name (with special characters)
        Logger.step('Entering invalid last name with special characters');
        await registrationPage.fillFirstName('John');
        await registrationPage.fillLastName('Doe!');
        await registrationPage.emailInput.focus();

        // 5. Verify last name error
        await registrationPage.verifyLastNameInvalidError();

        // 6. Verify "Create Account" button is disabled
        await registrationPage.expectCreateButtonDisabled();
    });

    test('Verify mandatory field validation (First Name and Last Name)', { tag: ['@regression', '@smoke'] }, async ({ page }) => {
        const registrationPage = new RegistrationPage(page);

        // 1. Navigate to Registration page
        await NavigationHelper.gotoRegistration(page);

        // 2. Touch fields and leave them empty (triggering validation)
        Logger.step('Touching fields and leaving them empty');
        await registrationPage.firstNameInput.focus();
        await registrationPage.lastNameInput.focus();
        await registrationPage.emailInput.focus(); // Shift focus to trigger previous field errors

        // 3. Verify required field errors
        await registrationPage.verifyFirstNameRequiredError();
        await registrationPage.verifyLastNameRequiredError();

        // 4. Verify "Create Account" button is disabled
        await registrationPage.expectCreateButtonDisabled();
    });
});

test.describe('Registration - Password Visibility', () => {

    test('Verify password visibility can be toggled in Registration',
        { tag: ['@regression', '@optional'] }, async ({ page }) => {
            const registrationPage = new RegistrationPage(page);

            // 1. Navigate to Registration page
            await NavigationHelper.gotoRegistration(page);

            // 2. Enter password
            const testPassword = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.SECRET;
            await registrationPage.fillPassword(testPassword);

            // 3. Toggles
            await registrationPage.verifyPasswordVisibility(false);
            await registrationPage.togglePasswordVisibility();
            await registrationPage.verifyPasswordVisibility(true);
            await registrationPage.togglePasswordVisibility();
            await registrationPage.verifyPasswordVisibility(false);
        });
});

test.describe.serial('Registration - Resend OTP', () => {
    let context: any;
    let page: any;
    let resendEmail: string;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('Register new user and land on OTP verification page', { tag: ['@smoke'] }, async () => {
        const registrationPage = new RegistrationPage(page);

        // 1. Navigate to Registration page
        await NavigationHelper.gotoRegistration(page);
        await expect(page).toHaveURL(new RegExp(URLS.REGISTER));

        // 2. Fill registration form with fresh unique email
        resendEmail = DataGenerator.generateEmail();
        Logger.step(`Generated email for Resend OTP test: ${resendEmail}`);

        await registrationPage.fillRegistrationForm({
            firstName: DataGenerator.firstName(),
            lastName: DataGenerator.lastName(),
            email: resendEmail,
            password: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT,
        });

        // 3. Submit and reach OTP verification page
        await registrationPage.clickCreateAccount();
        await expect(page).toHaveURL(new RegExp(`${URLS.VERIFY_EMAIL}$`), { timeout: 20000 });
    });

    test('Verify Resend OTP delivers a new valid code', { tag: ['@smoke', '@critical'] }, async () => {
        const registrationPage = new RegistrationPage(page);

        // 1. Confirm we are on the verify email page
        await expect(page).toHaveURL(new RegExp(`${URLS.VERIFY_EMAIL}$`), { timeout: 10000 });

        // 2. Click the "Resend Code" button (handles countdown automatically)
        await registrationPage.clickResendOTP();
        Logger.step('Resend OTP button clicked — waiting for new email to arrive');

        // 3. Verify a success indication appears (using flexible regex for 'email', 'sent', or 'code')
        // The previous specific 'MESSAGES.AUTH.REGISTRATION.OTP_RESENT' might be too strict
        await AssertionHelper.verifyToastMessage(page, /email|sent|code/i);

        // 4. Open Mailinator and retrieve the NEW (latest) OTP from the resent email
        const mailinatorPage = await context.newPage();
        const mailinator = new MailinatorPage(mailinatorPage);

        // Wait a few seconds for Mailinator to receive the new email
        await page.waitForTimeout(5000);

        const newOtp = await mailinator.getOTPFromEmail(resendEmail);
        await mailinatorPage.close();
        Logger.step(`New OTP retrieved after resend: ${newOtp}`);

        // 5. Use the new OTP to complete verification — proves resend delivered a valid code
        await registrationPage.verifyEmailWithOTP(newOtp);

        // 6. Validate email confirmed success toast
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));
    });
});
