import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { MESSAGES } from '../../data/constants/messages';
import { Logger } from '../../utils/Logger';

export class ResetPasswordPage extends BasePage {
    private readonly passwordInput: Locator;
    private readonly confirmPasswordInput: Locator;
    private readonly confirmButton: Locator;
    private readonly pageHeading: Locator;
    private readonly successToast: Locator;

    // Internal UI Labels (Static)
    private static readonly LABELS = {
        PASSWORD_NAME: 'password',
        CONFIRM_PASSWORD_NAME: 'password-confirm',
        CONFIRM_BUTTON: 'Create new password',
        HEADING: 'Create new password',
    };

    constructor(page: Page) {
        super(page);
        this.passwordInput = page.locator(`input[name="${ResetPasswordPage.LABELS.PASSWORD_NAME}"]`);
        this.confirmPasswordInput = page.locator(`input[name="${ResetPasswordPage.LABELS.CONFIRM_PASSWORD_NAME}"]`);
        this.confirmButton = page.getByRole('button', { name: ResetPasswordPage.LABELS.CONFIRM_BUTTON });
        this.pageHeading = page.getByRole('heading', { name: ResetPasswordPage.LABELS.HEADING });
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
        await this.click(this.confirmButton);
    }

    async verifyPasswordUpdatedMessage() {
        await this.expectVisible(this.successToast, 'Password updated toast should be visible');
    }
}
