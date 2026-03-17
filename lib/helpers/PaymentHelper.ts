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
     * Selects the Multi-Group Plan ($49) and proceeds to payment.
     */
    static async selectMultiGroupPlanAndProceed(page: Page) {
        Logger.step('Selecting Multi-Group Plan ($49)');
        const hostingPlanPage = new HostingPlanPage(page);
        await hostingPlanPage.verifyPageLoaded();
        await hostingPlanPage.selectMultiGroupPlan();
        await hostingPlanPage.clickPayNow();
        Logger.success('Multi-Group plan selected, landing on Stripe Checkout');
    }

    /**
     * Fills Stripe payment details and submits.
     */
    static async fillStripeAndPay(page: Page, options?: { cardNumber?: string; expiry?: string; cvc?: string; postalCode?: string }) {
        Logger.step('Completing Stripe Payment');
        const stripePage = new StripePage(page);
        await stripePage.verifyStripeFormVisible();
        await stripePage.fillPaymentDetails(options);
        await stripePage.submitPayment();
        Logger.success('Stripe payment submitted');
    }

    /**
     * Verifies the success confirmation and continues to the group creation or dashboard.
     * 
     * Context: After payment, the app might either show a "Payment Success" popup 
     * or redirect directly to the "Create Group" page (/groups/create).
     */
    static async verifySuccessAndContinue(page: Page) {
        Logger.step('Verifying Payment Success (Redirect or Popup)');

        // 1. Wait for either the Success Popup OR the direct redirect to /groups/create
        // We use a races-like approach: wait for URL change OR modal visibility
        const createGroupPath = '/groups/create';
        const modalSelector = 'dialog, .chakra-modal__content, section[role="dialog"]';

        await page.waitForFunction((args) => {
            const urlMatch = window.location.pathname.includes(args.path);
            const modalMatch = !!document.querySelector(args.modal);
            return urlMatch || modalMatch;
        }, { path: createGroupPath, modal: modalSelector }, { timeout: 45000 });

        const currentUrl = page.url();
        Logger.info(`Final payment landing state: ${currentUrl}`);

        // 2. Handle the "Payment Success" Popup if it appeared
        const isPopupVisible = await page.locator(modalSelector).isVisible({ timeout: 2000 }).catch(() => false);
        if (isPopupVisible) {
            Logger.info('Success popup detected. Dismissing to proceed...');
            const successPopup = new PaymentSuccessPopup(page);
            await successPopup.verifyVisible();
            await successPopup.clickDoThisLater();
        } else if (currentUrl.includes(createGroupPath) || currentUrl.includes('/groups/new')) {
            Logger.success('Direct redirect to Group Creation page detected. Bypassing popup logic.');
        }

        // 3. Final verification - User should be on Create Group or Dashboard
        await page.waitForURL(url => 
            url.pathname.includes('/groups/create') || 
            url.pathname.includes('/groups/new') || 
            url.pathname.includes('/groups'), 
            { timeout: 15_000 }
        );
        
        Logger.success('Subscription completed and reached target page.');
    }
}
