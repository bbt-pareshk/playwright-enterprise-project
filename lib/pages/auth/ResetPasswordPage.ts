import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { MESSAGES } from '../../data/constants/messages';
import { Logger } from '../../utils/Logger';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

export class ResetPasswordPage extends BasePage {
    private readonly passwordInput: Locator;
    private readonly confirmPasswordInput: Locator;
    private readonly confirmButton: Locator;
    private readonly pageHeading: Locator;
    private readonly successToast: Locator;

    constructor(page: Page) {
        super(page);
        this.passwordInput = page.locator(`input[name="${UI_CONSTANTS.AUTH.RESET_PASSWORD.PASSWORD_NAME}"]`);
        this.confirmPasswordInput = page.locator(`input[name="${UI_CONSTANTS.AUTH.RESET_PASSWORD.CONFIRM_PASSWORD_NAME}"]`);
        this.confirmButton = page.getByRole('button', { name: UI_CONSTANTS.AUTH.RESET_PASSWORD.CONFIRM_BUTTON });
        // HEADING is now a <p> tag
        this.pageHeading = page.getByText(UI_CONSTANTS.AUTH.RESET_PASSWORD.HEADING).first();
        this.successToast = page.getByText(MESSAGES.AUTH.RESET_PASSWORD.SUCCESS);
    }

    async verifyResetPasswordPageVisible() {
        await this.expectVisible(this.pageHeading, 'Create new password heading should be visible');
    }

    async enterPassword(password: string) {
        Logger.info(`Entering new password: ${password}`);
        await this.stableFill(this.passwordInput, password);
    }

    async enterConfirmPassword(password: string) {
        Logger.info('Entering confirm password');
        await this.stableFill(this.confirmPasswordInput, password);
    }

    async clickConfirmPasswordButton() {
        Logger.info('Clicking Confirm Password button');
        await this.robustClick(this.confirmButton);
    }

    async verifyPasswordUpdatedMessage() {
        await this.expectVisible(this.successToast, 'Password updated toast should be visible');
    }
}
