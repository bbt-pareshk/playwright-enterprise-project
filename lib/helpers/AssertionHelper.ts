import { Page, expect } from '@playwright/test';
import { Logger } from '../utils/Logger';
import { Wait } from '../utils/Wait';
import { URLS } from '../../config/urls';
import { MESSAGES } from '../data/constants/messages';
import { UI_CONSTANTS } from '../data/constants/ui-constants';

/**
 * AssertionHelper
 * ---------------
 * Encapsulates common business-level validations across the application.
 * Internally uses Playwright's native expect for stability.
 */
export class AssertionHelper {

    /**
     * Verifies that a toast/success message is visible on the page.
     */
    static async verifyToastMessage(page: Page, message: string | RegExp) {
        Logger.assertion(`Verifying toast message matching: ${message}`);
        
        const searchPattern = typeof message === 'string' 
            ? new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '.*'), 'i') 
            : message;

        // Lifetime Fix: Use a broader selector for any alert/toast container
        const toastSelector = '.chakra-toast, .chakra-alert, .Toastify__toast, [role="status"], [role="alert"]';
        const toast = page.locator(toastSelector).filter({ hasText: searchPattern }).first();
        
        try {
            // Shortened timeout for the initial 'soft' check to keep suite fast
            await expect(toast).toBeVisible({ timeout: 10_000 });
        } catch (e) {
            // Find ALL elements matching the toast selector
            const possibleToasts = page.locator(toastSelector);
            const count = await possibleToasts.count();
            let foundMessages = [];

            for (let i = 0; i < count; i++) {
                const text = await possibleToasts.nth(i).innerText().catch(() => '');
                // Filtering out the "MentalHappy" logo false positive
                if (text && !text.includes('MentalHappy')) {
                    foundMessages.push(text.trim());
                }
            }
            
            const textContent = foundMessages.length > 0 ? foundMessages.join(' | ') : 'none';
            Logger.warn(`Toast mismatch/timeout. Expected pattern: ${searchPattern}. Found: ${textContent}`);
            
            if (textContent !== 'none') {
                throw new Error(`Toast text mismatch. Expected: ${message}, Found: ${textContent}`);
            }
            throw e;
        }
    }

    /**
     * Verifies that the dashboard has loaded successfully.
     */
    static async verifyDashboardLoaded(page: Page) {
        Logger.assertion('Verifying dashboard is loaded');

        // Robustness: Handle redirect and trailing slashes
        await expect(page).toHaveURL(new RegExp(URLS.DASHBOARD), { timeout: 15_000 });

        // Use a common dashboard element to confirm load
        const findButton = page.getByRole('link', { name: UI_CONSTANTS.DASHBOARD.FIND_SUPPORT_GROUP_BUTTON }).first();
        await Wait.forVisible(findButton, 30_000);
        Logger.success('Dashboard load verified');
    }

    /**
     * Verifies that a payment was successful based on the success message.
     */
    static async verifySuccessfulPayment(page: Page) {
        Logger.assertion('Verifying payment success');
        const successMessage = page.getByText(new RegExp(MESSAGES.PAYMENT.SUCCESS, 'i'));
        await expect(successMessage).toBeVisible({ timeout: 20_000 });
        Logger.success('Payment success verified');
    }

    /**
     * Verifies that a specific heading is visible on the page.
     */
    static async verifyHeadingVisible(page: Page, headingText: string | RegExp) {
        Logger.assertion(`Verifying heading: ${headingText}`);
        const heading = page.getByRole('heading', { name: headingText });
        await expect(heading).toBeVisible({ timeout: 10_000 });
    }
}
