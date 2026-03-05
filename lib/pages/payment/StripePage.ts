import { Page, Locator, FrameLocator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { APP_CONSTANTS } from '../../data/constants/app-constants';

/**
 * StripePage (Phase 3-A)
 * ---------------------
 * Handles the updated Stripe payment UI.
 * This works alongside the legacy GroupActivationPaymentPage.
 */
export class StripePage extends BasePage {
    private readonly stripeFrame: FrameLocator;
    private readonly payNowButton: Locator;

    constructor(page: Page) {
        super(page);

        // Standard Stripe iframe
        this.stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');

        // "Pay Now" button is typically outside the iframe in this version
        this.payNowButton = page.getByRole('button', { name: /Pay Now/i });
    }

    /**
     * Verifies the Stripe form is visible and ready for input.
     */
    async verifyStripeFormVisible() {
        Logger.step('Verifying Stripe form visibility');
        // Check for any common field inside the iframe
        const anyStripeField = this.stripeFrame.locator('#payment-numberInput, #Field-numberInput').first();
        await this.expectVisible(anyStripeField, 'Stripe card number field should be visible');
        await this.expectVisible(this.payNowButton, 'Pay Now button should be visible');
        Logger.success('Stripe form verified');
    }

    /**
     * Fills the payment details inside the Stripe iframe.
     */
    async fillPaymentDetails(options?: { cardNumber?: string; expiry?: string; cvc?: string; postalCode?: string, countryCode?: string }) {
        Logger.step('Filling Stripe payment details');

        const frame = this.stripeFrame;

        // Use Playwright's native resilient `.or()` logic to handle Stripe version mutations without race conditions
        const country = frame.locator('select[name="country"]').or(frame.locator('#payment-countryInput')).first();
        const postal = frame.locator('#payment-postalCodeInput').or(frame.locator('input[name="postal"]')).first();
        const number = frame.locator('[autocomplete="cc-number"]').or(frame.locator('input[name="cardnumber"]')).first();
        const expiry = frame.locator('[autocomplete="cc-exp"]').or(frame.locator('input[name="exp-date"]')).first();
        const cvc = frame.locator('[autocomplete="cc-csc"]').or(frame.locator('input[name="cvc"]')).first();

        const details = {
            cardNumber: options?.cardNumber || APP_CONSTANTS.TEST_DATA.PAYMENT.CARD_NUMBER,
            expiry: options?.expiry || APP_CONSTANTS.TEST_DATA.PAYMENT.EXPIRY,
            cvc: options?.cvc || APP_CONSTANTS.TEST_DATA.PAYMENT.CVC,
            postalCode: options?.postalCode || APP_CONSTANTS.TEST_DATA.PAYMENT.POSTAL_CODE,
            countryCode: options?.countryCode || APP_CONSTANTS.TEST_DATA.PAYMENT.COUNTRY_CODE,
        };

        // 1. COUNTRY (If available/required)
        if (await country.count() > 0) {
            Logger.step('Selecting country: ' + details.countryCode);
            await country.selectOption(details.countryCode);
        }

        // 2. POSTAL CODE 
        // Must be filled BEFORE the card data to prevent automatic API validation firing off prematurely.
        if (await postal.count() > 0) {
            await postal.click();
            await postal.fill(details.postalCode);
        }

        // 3. CARD NUMBER
        // Fill fields with minor delays for stability (Sequential typing prevents Stripe validation race conditions)
        await number.click();
        await number.clear();
        await number.pressSequentially(details.cardNumber, { delay: 40 });

        // 4. EXPIRY
        await expiry.click();
        await expiry.clear();
        await expiry.pressSequentially(details.expiry, { delay: 40 });

        // 5. CVC 
        // Kept last as typing the final digit often triggers Stripe's background submission hook
        await cvc.click();
        await cvc.clear();
        await cvc.pressSequentially(details.cvc, { delay: 40 });

        Logger.success('Stripe payment details filled');
    }

    /**
     * Submits the payment by clicking "Pay Now".
     */
    async submitPayment() {
        Logger.step('Submitting payment');
        // Make sure the button is not disabled before clicking
        await this.payNowButton.waitFor({ state: 'visible' });
        await this.click(this.payNowButton);
        // Add a slight static wait to allow the external Stripe API to process before modal assertion on CI finishes instantly
        await this.page.waitForTimeout(3000);
        Logger.success('Payment submitted');
    }

    /**
     * Factory/Static Detector to determine which Stripe UI is active.
     */
    static async detect(page: Page): Promise<'new' | 'legacy'> {
        const payNow = page.getByRole('button', { name: /Pay Now/i }).first();
        const payAndActivate = page.getByRole('button', { name: /Pay and Activate/i }).first();

        if (await payNow.isVisible()) return 'new';
        if (await payAndActivate.isVisible()) return 'legacy';

        // Fallback to iframe detection if buttons are ambiguous
        return 'new';
    }
}
