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
        Logger.assertion(`Verifying toast message: ${message}`);
        const toast = page.getByText(message);
        await expect(toast).toBeVisible({ timeout: 15_000 });
    }

    /**
     * Verifies that the dashboard has loaded successfully.
     */
    static async verifyDashboardLoaded(page: Page) {
        Logger.assertion('Verifying dashboard is loaded');
        await expect(page).toHaveURL(new RegExp(URLS.DASHBOARD));

        // Use a common dashboard element to confirm load
        const findButton = page.getByRole('button', { name: UI_CONSTANTS.DASHBOARD.FIND_SUPPORT_GROUP_BUTTON });
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
