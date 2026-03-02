import { Page, expect } from '@playwright/test';
import { HostingPlanPage } from '../pages/hosting/HostingPlanPage';
import { StripePage } from '../pages/payment/StripePage';
import { PaymentSuccessPopup } from '../pages/payment/PaymentSuccessPopup';
import { AssertionHelper } from './AssertionHelper';
import { Logger } from '../utils/Logger';

/**
 * PaymentHelper
 * -------------
 * Orchestrates subscription and payment flows.
 */
export class PaymentHelper {

    /**
     * Selects the Active Plan ($19) and proceeds to payment.
     */
    static async selectActivePlanAndProceed(page: Page) {
        Logger.step('Selecting Active Plan ($19)');
        const hostingPlanPage = new HostingPlanPage(page);
        await hostingPlanPage.verifyPageLoaded();
        await hostingPlanPage.selectActivePlan();
        await hostingPlanPage.clickPayNow();
        Logger.success('Plan selected, landing on Stripe Checkout');
    }

    /**
     * Fills Stripe payment details and submits.
     */
    static async fillStripeAndPay(page: Page) {
        Logger.step('Completing Stripe Payment');
        const stripePage = new StripePage(page);
        await stripePage.verifyStripeFormVisible();
        await stripePage.fillPaymentDetails();
        await stripePage.submitPayment();
        Logger.success('Stripe payment submitted');
    }

    /**
     * Verifies the success popup and continues to the dashboard.
     */
    static async verifySuccessAndContinue(page: Page) {
        Logger.step('Verifying Payment Success Popup');
        const successPopup = new PaymentSuccessPopup(page);
        await successPopup.verifyVisible();

        // Handle potential auto-dismiss or fast redirect
        const isPopupVisible = await page.locator('.chakra-modal__content, section[role="dialog"]').isVisible({ timeout: 5000 }).catch(() => false);
        if (isPopupVisible) {
            await successPopup.clickDoThisLater();
        }

        await AssertionHelper.verifyDashboardLoaded(page);
        Logger.success('Subscription completed and returned to Dashboard');
    }
}
