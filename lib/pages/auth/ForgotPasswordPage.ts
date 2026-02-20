import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ROUTES, URLS } from '../../../config/urls';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';
import { MESSAGES } from '../../data/constants/messages';

export class ForgotPasswordPage extends BasePage {
    private readonly emailInput: Locator;
    private readonly resetPasswordButton: Locator;
    private readonly backToLoginLink: Locator;
    private readonly pageHeading: Locator;
    private readonly successToast: Locator;

    constructor(page: Page) {
        super(page);
        this.emailInput = page.getByLabel(UI_CONSTANTS.AUTH.FORGOT_PASSWORD.EMAIL_LABEL);
        this.resetPasswordButton = page.getByRole('button', { name: UI_CONSTANTS.AUTH.FORGOT_PASSWORD.RESET_BUTTON });
        this.backToLoginLink = page.getByRole('link', { name: UI_CONSTANTS.AUTH.FORGOT_PASSWORD.BACK_TO_LOGIN_LINK });
        this.pageHeading = page.getByRole('heading', { name: UI_CONSTANTS.AUTH.FORGOT_PASSWORD.HEADING });
        this.successToast = page.getByText(MESSAGES.AUTH.FORGOT_PASSWORD.SUCCESS);
    }

    async verifyForgotPasswordPageVisible() {
        await this.expectVisible(this.pageHeading, UI_CONSTANTS.AUTH.ASSERTION_MESSAGES.RESET_HEADING_VISIBLE);
    }

    async enterEmail(email: string) {
        await this.stableFill(this.emailInput, email);
    }

    async clickResetPassword() {
        await this.click(this.resetPasswordButton);
    }

    async verifySuccessMessage() {
        await this.expectVisible(this.successToast, UI_CONSTANTS.AUTH.ASSERTION_MESSAGES.SUCCESS_MESSAGE_VISIBLE);
    }

    async openForgotPasswordPage() {
        await this.goto(ROUTES.reset());
    }
}
