import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ROUTES } from '../../../config/urls';
import { MESSAGES } from '../../data/constants/messages';

export class ForgotPasswordPage extends BasePage {
    private readonly emailInput: Locator;
    private readonly resetPasswordButton: Locator;
    private readonly backToLoginLink: Locator;
    private readonly pageHeading: Locator;
    private readonly successToast: Locator;

    // Internal UI Labels (Static)
    private static readonly LABELS = {
        EMAIL: 'Email',
        RESET_BUTTON: 'Reset Password',
        BACK_TO_LOGIN: 'Back to Login',
        HEADING: 'Reset password',
    };

    constructor(page: Page) {
        super(page);
        this.emailInput = page.getByLabel(ForgotPasswordPage.LABELS.EMAIL);
        this.resetPasswordButton = page.getByRole('button', { name: ForgotPasswordPage.LABELS.RESET_BUTTON });
        this.backToLoginLink = page.getByRole('link', { name: ForgotPasswordPage.LABELS.BACK_TO_LOGIN });
        this.pageHeading = page.getByRole('heading', { name: ForgotPasswordPage.LABELS.HEADING });
        this.successToast = page.getByText(MESSAGES.AUTH.FORGOT_PASSWORD.SUCCESS);
    }

    async verifyForgotPasswordPageVisible() {
        await this.expectVisible(this.pageHeading, 'Reset password heading should be visible');
    }

    async enterEmail(email: string) {
        await this.stableFill(this.emailInput, email);
    }

    async clickResetPassword() {
        await this.click(this.resetPasswordButton);
    }

    async verifySuccessMessage() {
        await this.expectVisible(this.successToast, 'Success message should be visible');
    }

    async openForgotPasswordPage() {
        await this.goto(ROUTES.reset());
    }
}
