import { Page, Locator, expect, test } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Wait } from '../../utils/Wait';
import { ROUTES, URLS, ROUTE_PATHS } from '../../../config/urls';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';
import { MESSAGES } from '../../data/constants/messages';
import { Logger } from '../../utils/Logger';

export class RegistrationPage extends BasePage {
  // --------- Input Fields ----------
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;

  // --------- Buttons ----------
  readonly createAccountButton: Locator;

  // --------- Validation Messages ----------
  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;


  constructor(page: Page) {
    super(page);

    // Inputs (stable by name attribute)
    this.firstNameInput = page.locator('input[name="firstname"]');
    this.lastNameInput = page.locator('input[name="lastname"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');

    // Button
    this.createAccountButton = page.locator('button[type="submit"]', {
      hasText: UI_CONSTANTS.AUTH.REGISTRATION.CREATE_ACCOUNT_BUTTON,
    });

    // Error messages - resolved dynamically from each input's form-control ancestor
    // to survive Chakra UI's auto-generated ID counter shifts between page loads
    this.firstNameError = page.locator('input[name="firstname"]').locator('xpath=ancestor::div[contains(@class,"chakra-form-control")]//div[contains(@id,"-feedback")]');
    this.lastNameError = page.locator('input[name="lastname"]').locator('xpath=ancestor::div[contains(@class,"chakra-form-control")]//div[contains(@id,"-feedback")]');
    this.emailError = page.locator('input[name="email"]').locator('xpath=ancestor::div[contains(@class,"chakra-form-control")]//div[contains(@id,"-feedback")]');
    this.passwordError = page.locator('input[name="password"]').locator('xpath=ancestor::div[contains(@class,"chakra-form-control")]//div[contains(@id,"-feedback")]');

    // Password Toggle Button
    this.passwordToggleBtn = page.locator('input[name="password"] ~ .chakra-input__right-element button');
  }

  private readonly passwordToggleBtn: Locator;

  /**
   * Toggles the password visibility by clicking the show/hide icon.
   */
  async togglePasswordVisibility() {
    await this.click(this.passwordToggleBtn);
  }

  /**
   * Verifies if the password is visible or hidden.
   * @param isVisible True if password should be visible (type="text"), false if hidden (type="password").
   */
  async verifyPasswordVisibility(isVisible: boolean) {
    const expectedType = isVisible ? 'text' : 'password';
    const actualType = await this.passwordInput.getAttribute('type');

    if (actualType !== expectedType) {
      throw new Error(`${MESSAGES.AUTH.REGISTRATION.PASSWORD_VISIBILITY_ERROR} "${expectedType}", but found "${actualType}"`);
    }
  }

  // ---------- Actions ----------

  async goto() {
    await super.goto(ROUTES.register());
  }

  async fillFirstName(firstName: string) {
    await this.stableFill(this.firstNameInput, firstName);
  }

  async fillLastName(lastName: string) {
    await this.stableFill(this.lastNameInput, lastName);
  }

  async fillEmail(email: string) {
    await this.stableFill(this.emailInput, email);
  }

  async fillPassword(password: string) {
    await this.stableFill(this.passwordInput, password);
  }

  /**
   * High-Performance Registration Action.
   * Replaced 20s hard pause with intelligent URL detection.
   */
  async clickCreateAccount() {
    Logger.info('Submitting registration form');

    // Tiny stabilization pause to allow form validation to settle
    await Wait.pause(this.page, 500);

    // Use robust click to handle potentially disabled button (useful for existing user detection)
    await this.robustClick(this.createAccountButton);

    // Dynamic wait for either verification page or a persistence state (like error toasts)
    await this.page.waitForURL(url =>
      url.pathname.includes(ROUTE_PATHS.VERIFY_EMAIL) ||
      url.pathname.includes(ROUTE_PATHS.REGISTER),
      { timeout: 20000 }
    ).catch(() => Logger.warn('Registration navigation timed out or encountered an intermediate state.'));
  }

  // ---------- Composite Actions ----------

  async fillRegistrationForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.fillPassword(data.password);
  }

  // ---------- Assertions ----------

  async expectCreateButtonEnabled() {
    await expect(this.createAccountButton).toBeEnabled();
  }

  async expectCreateButtonDisabled() {
    await expect(this.createAccountButton).toBeDisabled();
  }

  async expectRequiredFieldErrors() {
    await this.expectVisible(this.firstNameError);
    await this.expectVisible(this.lastNameError);
    await this.expectVisible(this.emailError);
    await this.expectVisible(this.passwordError);
  }

  // ---------- OTP Verification ----------

  /**
   * Enters OTP into pin input fields
   * @param otp - 6-digit OTP code
   */
  async enterOTP(otp: string): Promise<void> {
    if (otp.length !== 6) {
      throw new Error(`OTP must be 6 digits, received: ${otp}`);
    }

    // Split OTP into individual digits
    const digits = otp.split('');

    // Enter each digit into corresponding pin input using data-index
    for (let i = 0; i < digits.length; i++) {
      const pinInput = this.page.locator(`input.chakra-pin-input[data-index="${i}"]`);
      await pinInput.waitFor({ state: 'visible', timeout: 5000 });
      await pinInput.fill(digits[i]);
    }
  }

  /**
   * Clicks the "Verify Email" button
   */
  async clickVerifyEmail(): Promise<void> {
    const verifyButton = this.page.getByRole('button', { name: new RegExp(UI_CONSTANTS.AUTH.REGISTRATION.VERIFY_EMAIL_BUTTON, 'i') });
    await verifyButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.click(verifyButton);
  }

  /**
   * Complete OTP verification flow
   * @param otp - 6-digit OTP code
   */
  async verifyEmailWithOTP(otp: string): Promise<void> {
    await this.enterOTP(otp);
    await this.clickVerifyEmail();
  }

  /**
   * Clicks the "Resend Code" button on the email verification page.
   * Handles the countdown timer by waiting for the button to be re-enabled.
   */
  /**
   * Clicks the "Resend Code" button on the email verification page.
   * Handles the countdown timer by dynamically reading the remaining time from the DOM.
   */
  async clickResendOTP(): Promise<void> {
    Logger.info('Detecting Resend Code button state...');

    const resendButton = this.page.getByRole('button').filter({
      hasText: new RegExp(UI_CONSTANTS.AUTH.REGISTRATION.RESEND_OTP_BUTTON, 'i')
    });

    await resendButton.waitFor({ state: 'visible', timeout: 20000 });

    // Locate the countdown text and poll for a valid (non-zero) time
    // This handles race conditions where the text initially renders as "0 minutes 00" before JS updates it.
    const countdownLocator = this.page.locator('p.chakra-text').filter({ hasText: /resend in/i }).first();

    let totalSeconds = 0;

    for (let attempt = 0; attempt < 10; attempt++) {
      // Quick visibility check
      if (!await countdownLocator.isVisible().catch(() => false)) {
        await this.page.waitForTimeout(500);
        continue;
      }

      const fullText = await countdownLocator.innerText();

      // --- Parsing Logic ---
      const minMatch = fullText.match(/(\d+)\s*minutes?/i);
      const explicitSecMatch = fullText.match(/(\d+)\s*seconds?/i);
      const outputSecMatch = fullText.match(/minutes?\s*(\d+)\s*$/i);
      const bareNumberMatch = !minMatch ? fullText.match(/(\d+)/) : null;

      let currentSeconds = 0;
      if (minMatch) currentSeconds += parseInt(minMatch[1]) * 60;

      if (explicitSecMatch) {
        currentSeconds += parseInt(explicitSecMatch[1]);
      } else if (outputSecMatch) {
        currentSeconds += parseInt(outputSecMatch[1]);
      } else if (bareNumberMatch) {
        currentSeconds += parseInt(bareNumberMatch[1]);
      }

      if (currentSeconds > 0) {
        totalSeconds = currentSeconds;
        Logger.info(`Countdown initialized: "${fullText}" (${totalSeconds}s)`);
        break;
      }

      // If 0, wait and retry. "0 minutes 00" is often a placeholder during page load.
      if (attempt === 0) {
        Logger.info(`Timer initializing (value is currently placeholder "${fullText}"). Waiting for real countdown...`);
      }
      await this.page.waitForTimeout(500);
    }

    if (totalSeconds > 0) {
      Logger.info(`Time remaining: ${totalSeconds} seconds.`);

      // If wait is too long (e.g., > 2 minutes), skip to avoid hanging
      if (totalSeconds > 120) {
        const minutes = Math.round(totalSeconds / 60);
        Logger.warn(`Environment Lockout: Resend cooldown is ${minutes} minutes. Skipping test.`);
        test.skip(true, `Test skipped due to environment rate limit (${minutes} min wait)`);
      }

      Logger.info(`Waiting ${totalSeconds}s for resend countdown...`);
      // Wait with a small buffer
      await this.page.waitForTimeout((totalSeconds + 1) * 1000);
    } else {
      Logger.info('No active countdown detected (timer is 0 or not found). expecting button enablement.');
    }

    Logger.info('Waiting for button to be enabled...');

    // Use a timeout that fits within the global 90s test timeout
    try {
      await expect(resendButton).toBeEnabled({ timeout: 70_000 });
    } catch (e) {
      if (this.page.isClosed()) throw e;
      const currentText = await resendButton.innerText().catch(() => 'unknown');
      throw new Error(`Resend button timeout. Final state: "${currentText}"`);
    }

    await this.robustClick(resendButton);
    Logger.success('Resend OTP button clicked');
  }

  async verifyPasswordLengthError() {
    await this.expectVisible(this.passwordError);
    await expect(this.passwordError).toHaveText(MESSAGES.AUTH.REGISTRATION.PASSWORD_LENGTH_ERROR);
  }

  /**
   * Fills email and triggers blur so the server-side availability check fires.
   */
  async fillEmailAndBlur(email: string) {
    await this.stableFill(this.emailInput, email);
    // Tab away to trigger the async email availability API check on blur
    await this.emailInput.press('Tab');
  }

  async verifyFirstNameInvalidError() {
    await this.expectVisible(this.firstNameError);
    await expect(this.firstNameError).toHaveText(MESSAGES.AUTH.REGISTRATION.FIRST_NAME_INVALID);
  }

  async verifyLastNameInvalidError() {
    await this.expectVisible(this.lastNameError);
    await expect(this.lastNameError).toHaveText(MESSAGES.AUTH.REGISTRATION.LAST_NAME_INVALID);
  }

  async verifyFirstNameRequiredError() {
    await this.expectVisible(this.firstNameError);
    await expect(this.firstNameError).toHaveText(MESSAGES.AUTH.REGISTRATION.FIRST_NAME_REQUIRED);
  }

  async verifyLastNameRequiredError() {
    await this.expectVisible(this.lastNameError);
    await expect(this.lastNameError).toHaveText(MESSAGES.AUTH.REGISTRATION.LAST_NAME_REQUIRED);
  }

  /**
   * Waits for the "email is not available" server-side validation error.
   * Uses a longer timeout since this involves an async API round-trip.
   */
  async verifyEmailUnavailableError() {
    await this.emailError.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.emailError).toHaveText(MESSAGES.AUTH.REGISTRATION.EMAIL_UNAVAILABLE);
  }

}

