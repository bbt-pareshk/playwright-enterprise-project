import { test, expect } from '../../../lib/fixtures/index';
import { LoginPage } from '../../../lib/pages/auth/LoginPage';
import { ForgotPasswordPage } from '../../../lib/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../../../lib/pages/auth/ResetPasswordPage';
import { MailinatorPage } from '../../../lib/pages/utils/MailinatorPage';

// Helpers and Utilities
import { RuntimeStore } from '../../../lib/utils/RuntimeStore';
import { Logger } from '../../../lib/utils/Logger';
import { NavigationHelper } from '../../../lib/helpers/NavigationHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { AuthHelper } from '../../../lib/helpers/AuthHelper';
import { DataGenerator } from '../../../lib/utils/DataGenerator';

// Constants
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { MESSAGES } from '../../../lib/data/constants/messages';

test.describe('Forgot Password Flow', () => {

    test('User can request password reset and update password successfully',
        { tag: ['@smoke', '@regression'] },
        async ({ page, context }) => {
            // Enterprise flow with Mailinator + tabs needs more time
            test.setTimeout(180_000);
            test.slow();
            const loginPage = new LoginPage(page);
            const forgotPasswordPage = new ForgotPasswordPage(page);

            // 1. Prerequisite: Ensure User Exists
            let testEmail: string;
            try {
                testEmail = RuntimeStore.getUserEmail();
                Logger.info(`Using existing user email from store: ${testEmail}`);
            } catch (e) {
                // Support decoupled/isolated run
                testEmail = DataGenerator.generateEmail();
                Logger.info(`RuntimeStore empty. Using generated email: ${testEmail}`);
            }

            await AuthHelper.ensureUserExists(page, testEmail);

            // 2. Navigate to Login and open Forgot Password
            await NavigationHelper.gotoLogin(page);
            Logger.step('Navigating to Forgot Password page');
            await loginPage.clickForgotPassword();
            await forgotPasswordPage.verifyForgotPasswordPageVisible();

            // 3. Request Password Reset
            Logger.step(`Requesting password reset for: ${testEmail}`);
            await forgotPasswordPage.enterEmail(testEmail);
            await forgotPasswordPage.clickResetPassword();

            // 3. Verify Reset Email Sent Success Message
            await AssertionHelper.verifyToastMessage(page, MESSAGES.AUTH.FORGOT_PASSWORD.SUCCESS);

            // 4. Handle Email Verification via Mailinator
            Logger.step('Processing reset link via Mailinator');
            const mailinatorPageInstance = await context.newPage();
            const mailinator = new MailinatorPage(mailinatorPageInstance);

            await mailinator.openInbox(testEmail);
            // Specifically look for password reset emails
            await mailinator.openLatestEmail(60000, ['reset', 'password', 'forgot']);

            // Click the reset link and capture the new tab that opens
            Logger.info('Clicking Reset Link in Mailinator...');
            const [resetPage] = await Promise.all([
                context.waitForEvent('page', { timeout: 60000 }),
                mailinator.clickForgotPasswordResetLink()
            ]);

            Logger.success(`Reset link clicked. New page opened: ${resetPage.url()}`);
            await mailinatorPageInstance.close();

            // 5. Complete Password Reset in New Tab
            try {
                Logger.step('Completing password reset in new tab');
                await resetPage.waitForLoadState('load'); // Wait for full page load
                await resetPage.bringToFront();

                const resetPasswordPage = new ResetPasswordPage(resetPage);

                Logger.info('Verifying Reset Password page is visible...');
                await resetPasswordPage.verifyResetPasswordPageVisible();

                const newPassword = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.TEST;
                await resetPasswordPage.enterPassword(newPassword);
                await resetPasswordPage.enterConfirmPassword(newPassword);

                Logger.info('Submitting new password...');
                await resetPasswordPage.clickConfirmPasswordButton();

                // 6. Verify Password Updated Success Message
                Logger.info('Verifying success message toast...');
                await AssertionHelper.verifyToastMessage(resetPage, MESSAGES.AUTH.RESET_PASSWORD.SUCCESS);

                Logger.success('Forgot Password test completed successfully');
            } catch (error: any) {
                Logger.error(`Failure during Reset Password completion: ${error.message}`);
                // Capture additional state info on failure
                const currentUrl = resetPage.url();
                const pageContent = await resetPage.innerText('body').catch(() => 'N/A');
                Logger.info(`Failure URL: ${currentUrl}`);
                Logger.info(`Page Content Snippet: ${pageContent.substring(0, 200)}`);
                throw error;
            }
        }
    );
});
