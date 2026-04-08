import { Page, Locator, expect } from '@playwright/test';
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
    private readonly checkInboxHeading: Locator;
    private readonly resendText: Locator;
    private readonly resendTimer: Locator;

    constructor(page: Page) {
        super(page);
        this.emailInput = page.locator('input[name="email"]').first();
        this.resetPasswordButton = page.getByRole('button', { name: UI_CONSTANTS.AUTH.FORGOT_PASSWORD.RESET_BUTTON });
        this.backToLoginLink = page.getByRole('link', { name: UI_CONSTANTS.AUTH.FORGOT_PASSWORD.BACK_TO_LOGIN_LINK, exact: false });
        // HEADING is now a <p> tag, not a <h1>-<h6> role
        this.pageHeading = page.getByText(UI_CONSTANTS.AUTH.FORGOT_PASSWORD.HEADING).first();
        this.checkInboxHeading = page.getByText(UI_CONSTANTS.AUTH.FORGOT_PASSWORD.CHECK_INBOX_HEADING).first();
        this.resendText = page.getByText(UI_CONSTANTS.AUTH.FORGOT_PASSWORD.RESEND_TEXT);
        this.resendTimer = page.getByText(UI_CONSTANTS.AUTH.FORGOT_PASSWORD.RESEND_TIMER_PREFIX);
        this.successToast = page.getByText(MESSAGES.AUTH.FORGOT_PASSWORD.SUCCESS);
    }

    async verifyForgotPasswordPageVisible() {
        await this.expectVisible(this.pageHeading, `Expected '${UI_CONSTANTS.AUTH.FORGOT_PASSWORD.HEADING}' heading to be visible`);
    }

    async enterEmail(email: string) {
        // 1. Ensure any blocking popups are dismissed
        await this.dismissSupportPopups();

        // 2. Use stableFill for atomic value setting (avoids "click while typing" races)
        await this.stableFill(this.emailInput, email);

        // 3. Force a Tab press to ensure React/Chakra UI validation triggers
        await this.page.keyboard.press('Tab');

        Logger.info(`Email entered via stableFill: ${email}`);
    }

    async clickResetPassword() {
        // Ensure button is enabled before clicking to prevent silent failures
        await expect(this.resetPasswordButton).toBeEnabled({ timeout: 5000 });
        await this.robustClick(this.resetPasswordButton);
    }

    async verifySuccessMessage() {
        // More robust: Wait for EITHER the toast OR the success screen to appear
        // This avoids the race condition where isVisible() returns false too early
        await Promise.race([
            this.successToast.waitFor({ state: 'visible', timeout: 10000 }),
            this.checkInboxHeading.waitFor({ state: 'visible', timeout: 10000 })
        ]).catch(() => {
            Logger.warn('Neither success toast nor check inbox heading appeared within timeout');
        });

        const toastVisible = await this.successToast.isVisible();
        if (toastVisible) {
            Logger.info('Success toast detected');
        } else {
            await this.verifyCheckInboxVisible();
        }
    }

    async verifyCheckInboxVisible() {
        await this.expectVisible(this.checkInboxHeading, `Expected '${UI_CONSTANTS.AUTH.FORGOT_PASSWORD.CHECK_INBOX_HEADING}' heading to be visible`);
        Logger.info('Check your inbox screen is visible');
    }

    async verifyResendTimerVisible() {
        await this.expectVisible(this.resendText, 'Resend text should be visible');
        await this.expectVisible(this.resendTimer, 'Resend timer should be visible');
        const timerText = await this.resendTimer.innerText();
        Logger.info(`Resend timer is visible with text: ${timerText}`);
    }

    async clickBackToLogin() {
        await this.robustClick(this.backToLoginLink);
    }

    async openForgotPasswordPage() {
        await this.goto(ROUTES.reset());
    }

    async expectResetButtonDisabled() {
        await this.expectDisabled(this.resetPasswordButton, 'Reset Password button should be disabled for invalid input');
    }
}

