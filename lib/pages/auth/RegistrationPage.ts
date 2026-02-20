import { Page, Locator, expect } from '@playwright/test';
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
  async clickResendOTP(): Promise<void> {
    Logger.info('Detecting Resend Code button state...');

    const resendButton = this.page.getByRole('button').filter({
      hasText: new RegExp(UI_CONSTANTS.AUTH.REGISTRATION.RESEND_OTP_BUTTON, 'i')
    });

    await resendButton.waitFor({ state: 'visible', timeout: 20000 });

    // Try to find any lockout text (minutes, seconds, etc)
    const lockoutText = await this.page.locator('body').innerText().catch(() => '');
    const countdownMatch = lockoutText.match(/resend in \d+ (minutes|seconds)/i) || lockoutText.match(/(\d+)\s*min/i);
    if (countdownMatch) {
      Logger.warn(`LOCKOUT DETECTED: "${countdownMatch[0]}"`);
    }

    Logger.info('Waiting for button to be enabled (cooldown period)...');

    // Use a timeout that fits within the global 90s test timeout
    try {
      await expect(resendButton).toBeEnabled({ timeout: 70_000 });
    } catch (e) {
      // Safe check to avoid 'Target page closed' errors
      if (this.page.isClosed()) throw e;

      const currentText = await resendButton.innerText().catch(() => 'unknown');
      Logger.error(`Resend button still disabled after 70s. State: "${currentText}"`);

      if (currentText.toLowerCase().includes('minute')) {
        throw new Error(`CRITICAL LOCKOUT: Resend OTP shows minutes (${currentText}). Test cannot proceed.`);
      }
      throw new Error(`Resend button timeout. Final text: "${currentText}"`);
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

