import { test } from '../../../lib/fixtures/index';
import { LoginPage } from '../../../lib/pages/auth/LoginPage';
import { ForgotPasswordPage } from '../../../lib/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../../../lib/pages/auth/ResetPasswordPage';
import { VerificationService } from '../../../lib/utils/VerificationService';

// Helpers and Utilities
import { Logger } from '../../../lib/utils/Logger';
import { NavigationHelper } from '../../../lib/helpers/NavigationHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { AuthHelper } from '../../../lib/helpers/AuthHelper';

// Constants
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { MESSAGES } from '../../../lib/data/constants/messages';

/**
 * Forgot Password Journey
 * -----------------------
 * This spec validates the password recovery lifecycle from request to update.
 * 
 * DESIGN PRINCIPLES:
 * 1. Journey Architecture: Single test() block using test.step() for transparency.
 * 2. Service-Oriented: Uses VerificationService for simplified email handling.
 * 3. Robustness: Integrated prerequisite user creation.
 */
test.describe('Forgot Password Journey', { tag: ['@member', '@smoke'] }, () => {

    test('User can request password reset and update password successfully', async ({ page }) => {
        // Enterprise email flow needs additional time
        test.setTimeout(240_000);

        const loginPage = new LoginPage(page);
        const forgotPasswordPage = new ForgotPasswordPage(page);
        let testEmail: string;

        await test.step('FORGOT-01: Prerequisite - Ensure disposable user exists', async () => {
            testEmail = await AuthHelper.ensureDisposableUserExists(page);
            Logger.info(`Using test email: ${testEmail}`);
        });

        await test.step('FORGOT-02: Request - Navigate to Forgot Password and submit email', async () => {
            await NavigationHelper.gotoLogin(page);
            await loginPage.clickForgotPassword();
            await forgotPasswordPage.verifyForgotPasswordPageVisible();

            await forgotPasswordPage.enterEmail(testEmail);
            await forgotPasswordPage.clickResetPassword();

            await AssertionHelper.verifyToastMessage(page, MESSAGES.AUTH.FORGOT_PASSWORD.SUCCESS);
            Logger.success('Password reset request submitted successfully');
        });

        await test.step('FORGOT-03: Email Verification - Retrieve reset link and navigate', async () => {
            // Use VerificationService to handle Mailinator tab and link clicking
            const resetPage = await VerificationService.getResetPage(page, testEmail);
            Logger.success(`Reset page identified: ${resetPage.url()}`);

            const resetPasswordPage = new ResetPasswordPage(resetPage);

            await test.step('FORGOT-04: Reset - Complete password update in new tab', async () => {
                await resetPasswordPage.verifyResetPasswordPageVisible();

                const newPassword = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.TEST;
                await resetPasswordPage.enterPassword(newPassword);
                await resetPasswordPage.enterConfirmPassword(newPassword);
                await resetPasswordPage.clickConfirmPasswordButton();

                await AssertionHelper.verifyToastMessage(resetPage, MESSAGES.AUTH.RESET_PASSWORD.SUCCESS);
                Logger.success('Password updated successfully');
            });
        });
    });

    test.describe('Forgot Password - Boundary Validation', () => {
        test('Validation: Reset Password button is disabled on empty email submission', { tag: ['@regression'] }, async ({ page }) => {
            const loginPage = new LoginPage(page);
            const forgotPasswordPage = new ForgotPasswordPage(page);

            await NavigationHelper.gotoLogin(page);
            await loginPage.clickForgotPassword();
            await forgotPasswordPage.verifyForgotPasswordPageVisible();
            await forgotPasswordPage.expectResetButtonDisabled();
            Logger.success('Empty email validation verified');
        });
    });
});
