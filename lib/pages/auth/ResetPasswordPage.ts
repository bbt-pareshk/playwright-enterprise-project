import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';
import { MESSAGES } from '../../data/constants/messages';
import { Logger } from '../../utils/Logger';

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
        this.pageHeading = page.getByRole('heading', { name: UI_CONSTANTS.AUTH.RESET_PASSWORD.HEADING });
        this.successToast = page.getByText(MESSAGES.AUTH.RESET_PASSWORD.SUCCESS);
    }

    async verifyResetPasswordPageVisible() {
        await this.expectVisible(this.pageHeading, UI_CONSTANTS.AUTH.ASSERTION_MESSAGES.CREATE_PASS_HEADING_VISIBLE);
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
        await this.click(this.confirmButton);
    }

    async verifyPasswordUpdatedMessage() {
        await this.expectVisible(this.successToast, UI_CONSTANTS.AUTH.ASSERTION_MESSAGES.UPDATE_SUCCESS_VISIBLE);
    }
}
