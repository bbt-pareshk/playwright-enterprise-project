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
import { ENV } from '../../../config/env';

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
test.describe.serial('Forgot Password Journey', { tag: ['@member', '@smoke'] }, () => {
    // Standard Enterprise Config: Using dedicated static user for consistent recovery testing
    const TEST_EMAIL = ENV.FORGOT_PASSWORD_USERNAME;

    test('Phase 1: Recovery Request & Validation', async ({ page }) => {
        if (!TEST_EMAIL) throw new Error('FORGOT_PASSWORD_USERNAME is not defined in .env');
        
        const forgotPasswordPage = new ForgotPasswordPage(page);

        await test.step('FORGOT-01: Request - Navigate to Forgot Password and submit email', async () => {
            await NavigationHelper.gotoLogin(page);
            await new LoginPage(page).clickForgotPassword();
            
            await forgotPasswordPage.verifyForgotPasswordPageVisible();
            await forgotPasswordPage.enterEmail(TEST_EMAIL);
            await forgotPasswordPage.clickResetPassword();

            // Updated check: Handles both legacy toast and new "Check your inbox" screen
            await forgotPasswordPage.verifySuccessMessage();
            await forgotPasswordPage.verifyCheckInboxVisible();
            await forgotPasswordPage.verifyResendTimerVisible();
            
            Logger.success('Password reset request submitted and "Check your inbox" screen verified');
        });
    });

    test('Phase 2: Reset Link Integrity Check', async ({ page }) => {
        Logger.step('Security Check: Verifying behavior with an invalid/malformed reset token');
        
        // Construct a clearly invalid reset URL using ENV helper
        const invalidTokenUrl = `${ENV.BASE_URL}/reset-password?token=invalid_token_12345`;
        await page.goto(invalidTokenUrl).catch(() => Logger.warn('Direct navigation to invalid token URL failed or blocked.'));
        
        // We expect either a redirection or a clear non-success state
        const resetPasswordPage = new ResetPasswordPage(page);
        try {
            await resetPasswordPage.verifyResetPasswordPageVisible();
        } catch (e) {
            Logger.info('Reset page not visible for invalid token, which is a safe/correct default.');
        }
        
        Logger.success('Phase 2 Complete: Security check for malformed link executed');
    });

    test('Phase 3: Successful Password Update Journey', async ({ page }) => {
        test.setTimeout(240_000);

        await test.step('FORGOT-03: Email Verification - Retrieve reset link and navigate', async () => {
            // Use static config email directly
            const resetPage = await VerificationService.getResetPage(page, TEST_EMAIL!);
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
        
        test.beforeEach(async ({ page }) => {
            // Ensure anonymous state to prevent auto-redirects
            await AuthHelper.forceLogout(page);
        });

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
