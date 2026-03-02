import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';

/**
 * PaymentSuccessPopup (Phase 3-B)
 * ------------------------------
 * Handles the success confirmation dialog after a paid plan purchase.
 */
export class PaymentSuccessPopup extends BasePage {
    private readonly modalContainer: Locator;
    private readonly successHeading: Locator;
    private readonly doThisLaterButton: Locator;
    private readonly setUpGroupButton: Locator;

    // Internal UI Labels (Static)
    // ⚠️ All labels DOM-verified (2026-02-24) from captured_doms/payment_success_popup.html
    private static readonly LABELS = {
        HEADING: 'Payment successful',
        DO_THIS_LATER: 'Do this later',  // lowercase 'l' — DOM verified
        SET_UP_GROUP: 'Set Up Group',    // capital G — DOM verified
    };

    constructor(page: Page) {
        super(page);

        // Locators based on Chakra UI modal structure
        this.modalContainer = page.locator('.chakra-modal__content, section[role="dialog"]').first();
        this.successHeading = this.modalContainer.getByText(new RegExp(PaymentSuccessPopup.LABELS.HEADING, 'i'));
        this.doThisLaterButton = this.modalContainer.getByRole('button', { name: /do this later|do this later/i });
        this.setUpGroupButton = this.modalContainer.getByRole('button', { name: new RegExp(PaymentSuccessPopup.LABELS.SET_UP_GROUP, 'i') });
    }

    /**
     * Verifies that the payment success popup is visible.
     */
    async verifyVisible() {
        Logger.step('Verifying Payment Success popup visibility');
        await this.modalContainer.waitFor({ state: 'visible', timeout: 45000 });
        await this.expectVisible(this.modalContainer, 'Payment Success popup should be visible');
        await this.expectVisible(this.successHeading, 'Success heading should be displayed');
        Logger.success('Payment Success popup verified');
    }

    /**
     * Clicks "Do this later" and handles the redirect to dashboard.
     */
    async clickDoThisLater() {
        Logger.step(`Clicking "${PaymentSuccessPopup.LABELS.DO_THIS_LATER}"`);
        await this.click(this.doThisLaterButton);
        await this.modalContainer.waitFor({ state: 'hidden', timeout: 10000 });
        Logger.success('Success popup dismissed via Do this later');
    }

    /**
     * Clicks "Set Up Group" to proceed with group configuration.
     */
    async clickSetUpGroup() {
        Logger.step(`Clicking "${PaymentSuccessPopup.LABELS.SET_UP_GROUP}"`);
        await this.click(this.setUpGroupButton);
        await this.modalContainer.waitFor({ state: 'hidden', timeout: 10000 });
        Logger.success('Success popup dismissed via Set Up Group');
    }
}
