import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ROUTES } from '../../../config/urls';
import { MESSAGES } from '../../data/constants/messages';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';
import { Logger } from '../../utils/Logger';

export class ForgotPasswordPage extends BasePage {
    private readonly emailInput: Locator;
    private readonly resetPasswordButton: Locator;
    private readonly backToLoginLink: Locator;
    private readonly pageHeading: Locator;
    private readonly successToast: Locator;

    constructor(page: Page) {
        super(page);
        this.emailInput = page.getByLabel(UI_CONSTANTS.AUTH.FORGOT_PASSWORD.EMAIL_LABEL).first();
        this.resetPasswordButton = page.getByRole('button', { name: UI_CONSTANTS.AUTH.FORGOT_PASSWORD.RESET_BUTTON });
        this.backToLoginLink = page.getByRole('link', { name: UI_CONSTANTS.AUTH.FORGOT_PASSWORD.BACK_TO_LOGIN_LINK });
        // HEADING is now a <p> tag, not a <h1>-<h6> role
        this.pageHeading = page.getByText(UI_CONSTANTS.AUTH.FORGOT_PASSWORD.HEADING).first();
        this.successToast = page.getByText(MESSAGES.AUTH.FORGOT_PASSWORD.SUCCESS);
    }

    async verifyForgotPasswordPageVisible() {
        await this.expectVisible(this.pageHeading, `Expected '${UI_CONSTANTS.AUTH.FORGOT_PASSWORD.HEADING}' heading to be visible`);
    }

    async enterEmail(email: string) {
        await this.emailInput.waitFor({ state: 'visible' });
        await this.emailInput.clear();
        // Sequential typing with delay often triggers validation more reliably in React apps
        await this.emailInput.pressSequentially(email, { delay: 50 });
        // Force blur/validation trigger
        await this.emailInput.blur();
        await this.page.keyboard.press('Tab');
        Logger.info(`Email entered: ${email}`);
    }

    async clickResetPassword() {
        // Use robustClick to bypass potential "disabled" state delays
        await this.robustClick(this.resetPasswordButton);
    }

    async verifySuccessMessage() {
        await this.expectVisible(this.successToast, 'Success message should be visible');
    }

    async openForgotPasswordPage() {
        await this.goto(ROUTES.reset());
    }

    async expectResetButtonDisabled() {
        await this.expectDisabled(this.resetPasswordButton, 'Reset Password button should be disabled for invalid input');
    }
}

