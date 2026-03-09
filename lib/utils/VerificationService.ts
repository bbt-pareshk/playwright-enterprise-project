import { Page } from '@playwright/test';
import { MailinatorPage } from '../pages/utils/MailinatorPage';
import { ENV } from '../../config/env';
import { APP_CONSTANTS } from '../data/constants/app-constants';
import { Logger } from './Logger';

/**
 * VerificationService
 * -------------------
 * Orchestrates OTP retrieval logic. 
 * Supports both real Mailinator flows and staging-only bypass flows.
 */
export class VerificationService {

    /**
     * Retrieves the OTP for a given email address.
     * Automatically handles bypass logic if enabled and environment/email matches.
     */
    static async getOTP(page: Page, email: string): Promise<string> {
        const isBypassEmail = email.startsWith(APP_CONSTANTS.AUTH.OTP_BYPASS.PREFIX);
        const isStaging = ENV.CURRENT === 'staging';

        // Enterprise Bypass Check
        if (ENV.USE_OTP_BYPASS && isStaging && isBypassEmail) {
            Logger.info(`[OTP] Bypass active for ${email}. Returning fixed validation code: ${ENV.BYPASS_OTP_VALUE}`);
            return ENV.BYPASS_OTP_VALUE;
        }

        Logger.info(`[OTP] Requesting real verification code for ${email} via Mailinator`);

        // Encapsulated Mailinator retrieval logic
        const mailinatorTab = await page.context().newPage();
        const mailinator = new MailinatorPage(mailinatorTab);
        try {
            const otp = await mailinator.getOTPFromEmail(email);
            return otp;
        } finally {
            await mailinatorTab.close();
            await page.bringToFront();
        }
    }

    /**
     * Retrieves the reset password link from Mailinator.
     * Note: This opens a new tab, clicks the link, and returns the new page handle.
     */
    static async getResetPage(page: Page, email: string): Promise<Page> {
        Logger.info(`[ResetLink] Requesting password reset link for ${email} via Mailinator`);

        const mailinatorTab = await page.context().newPage();
        const mailinator = new MailinatorPage(mailinatorTab);

        try {
            // Click link and capture the new tab
            const [resetPage] = await Promise.all([
                page.context().waitForEvent('page', { timeout: 60000 }),
                mailinator.clickResetPasswordLinkFromEmail(email)
            ]);

            await resetPage.waitForLoadState('load');
            return resetPage;
        } finally {
            await mailinatorTab.close();
            await page.bringToFront();
        }
    }
}
