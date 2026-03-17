import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';

/**
 * FreeGroupPopup (Phase 2-D)
 * -------------------------
 * Handles the confirmation dialog that appears when selecting a Free Group plan.
 */
export class FreeGroupPopup extends BasePage {
    private readonly modalContainer: Locator;
    private readonly goToGroupButton: Locator;
    private readonly closeButton: Locator;

    // Internal UI Labels (Static)
    // ⚠️ DOM-verified (2026-02-24): The popup button uses plural "Groups"
    private static readonly LABELS = {
        GO_TO_GROUP: 'Create Your Group',
        CLOSE_ARIA: 'Close',
    };

    constructor(page: Page) {
        super(page);

        // Locators using Chakra UI standard patterns
        this.modalContainer = page.locator('.chakra-modal__content, section[role="dialog"]').first();
        this.goToGroupButton = this.modalContainer.getByRole('button', { name: FreeGroupPopup.LABELS.GO_TO_GROUP, exact: true });
        this.closeButton = this.modalContainer.locator('button[aria-label="Close"], button.chakra-modal__close-btn');
    }

    /**
     * Verifies that the Free Group popup is visible.
     */
    async verifyVisible() {
        Logger.step('Verifying Free Group popup visibility');
        // Increased timeout significantly to account for slow backend response on staging
        await this.expectVisible(this.modalContainer, 'Free Group popup should be visible', 30_000);
        
        // Match exact text from the provided DOM to ensure correct state
        await expect(this.modalContainer.getByText(/You're all set!/i)).toBeVisible({ timeout: 15_000 });
        await this.expectVisible(this.goToGroupButton, 'Go to Groups button should be visible in popup', 15_000);
        
        Logger.success('Free Group popup verified');
    }

    /**
     * Clicks "Go to Groups" inside the popup.
     */
    async clickGoToGroup() {
        Logger.step('Clicking Go to Groups in popup');
        await this.robustClick(this.goToGroupButton);
        await this.modalContainer.waitFor({ state: 'hidden', timeout: 15000 });
        Logger.success('Popup dismissed via Go to Groups');
    }

    /**
     * Closes the popup using the close button.
     */
    async clickClose() {
        Logger.step('Closing Free Group popup');
        await this.click(this.closeButton);
        await this.modalContainer.waitFor({ state: 'hidden', timeout: 5000 });
    }
}
