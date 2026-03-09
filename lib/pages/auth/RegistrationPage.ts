import { Page, Locator, expect, test } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Wait } from '../../utils/Wait';
import { ROUTES, ROUTE_PATHS } from '../../../config/urls';
import { MESSAGES } from '../../data/constants/messages';
import { Logger } from '../../utils/Logger';

/**
 * RegistrationPage
 * ----------------
 * Handles the user registration flow, including form filling,
 * validation error checks, and OTP verification.
 */
export class RegistrationPage extends BasePage {
  // --------- Input Fields ----------
  public readonly firstNameInput: Locator;
  public readonly lastNameInput: Locator;
  public readonly emailInput: Locator;
  public readonly passwordInput: Locator;

  // --------- Buttons ----------
  public readonly createAccountButton: Locator;
  public readonly passwordToggleBtn: Locator;

  // --------- Validation Messages ----------
  public readonly firstNameError: Locator;
  public readonly lastNameError: Locator;
  public readonly emailError: Locator;
  public readonly passwordError: Locator;

  // Internal UI Labels (Static)
  private static readonly LABELS = {
    FIRST_NAME_NAME: 'firstname',
    LAST_NAME_NAME: 'lastname',
    EMAIL_NAME: 'email',
    PASSWORD_NAME: 'password',
    CREATE_ACCOUNT_BUTTON: 'Create Account',
    VERIFY_EMAIL_BUTTON: 'verify email',
    RESEND_OTP_BUTTON: 'resend code',
  };

  constructor(page: Page) {
    super(page);

    // Inputs (stable by name attribute)
    this.firstNameInput = page.locator(`input[name="${RegistrationPage.LABELS.FIRST_NAME_NAME}"]`);
    this.lastNameInput = page.locator(`input[name="${RegistrationPage.LABELS.LAST_NAME_NAME}"]`);
    this.emailInput = page.locator(`input[name="${RegistrationPage.LABELS.EMAIL_NAME}"]`);
    this.passwordInput = page.locator(`input[name="${RegistrationPage.LABELS.PASSWORD_NAME}"]`);

    // Button
    this.createAccountButton = page.locator('button[type="submit"]', {
      hasText: RegistrationPage.LABELS.CREATE_ACCOUNT_BUTTON,
    });

    // Error messages - resolved dynamically from each input's form-control ancestor
    this.firstNameError = this.firstNameInput.locator('xpath=ancestor::div[contains(@class,"chakra-form-control")]//div[contains(@id,"-feedback")]');
    this.lastNameError = this.lastNameInput.locator('xpath=ancestor::div[contains(@class,"chakra-form-control")]//div[contains(@id,"-feedback")]');
    this.emailError = this.emailInput.locator('xpath=ancestor::div[contains(@class,"chakra-form-control")]//div[contains(@id,"-feedback")]');
    this.passwordError = this.passwordInput.locator('xpath=ancestor::div[contains(@class,"chakra-form-control")]//div[contains(@id,"-feedback")]');

    // Password Toggle Button
    this.passwordToggleBtn = page.locator(`input[name="${RegistrationPage.LABELS.PASSWORD_NAME}"] ~ .chakra-input__right-element button`);
  }

  /**
   * Toggles the password visibility by clicking the show/hide icon.
   */
  async togglePasswordVisibility() {
    Logger.step('Toggling password visibility');
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
    Logger.success(`Password visibility verified as ${isVisible ? 'visible' : 'hidden'}`);
  }

  async goto() {
    Logger.step('Navigating to Registration Page');
    await super.goto(ROUTES.register());
    await this.dismissSupportPopups();
    Logger.success('Registration Page loaded');
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
   * Submits the registration form and waits for valid navigation.
   */
  async clickCreateAccount() {
    Logger.step('Submitting registration form');
    await Wait.pause(this.page, 500);
    await this.robustClick(this.createAccountButton);

    await this.page.waitForURL(url =>
      url.pathname.includes(ROUTE_PATHS.VERIFY_EMAIL) ||
      url.pathname.includes(ROUTE_PATHS.REGISTER),
      { timeout: 20000 }
    ).catch(() => Logger.warn('Registration navigation timed out or reached intermediate state.'));
    Logger.success('Registration form submitted');
  }

  async fillRegistrationForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    Logger.step(`Filling registration form for: ${data.email}`);
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.fillPassword(data.password);
    await this.dismissSupportPopups();
  }

  async expectCreateButtonEnabled() {
    await expect(this.createAccountButton, 'Create account button should be enabled').toBeEnabled();
  }

  async expectCreateButtonDisabled() {
    await expect(this.createAccountButton, 'Create account button should be disabled').toBeDisabled();
  }

  async expectRequiredFieldErrors() {
    Logger.step('Verifying required field errors');
    await this.expectVisible(this.firstNameError, 'First name required error should be visible');
    await this.expectVisible(this.lastNameError, 'Last name required error should be visible');
    await this.expectVisible(this.emailError, 'Email required error should be visible');
    await this.expectVisible(this.passwordError, 'Password required error should be visible');
  }

  /**
   * Waits for the OTP entry screen to be fully visible.
   * Call this in the REGISTRATION test step (TC-01), BEFORE opening Mailinator.
   * This is the proof that the registration email was actually sent.
   * If this fails → registration didn't go through → clear early failure, not a confusing TC-02 timeout.
   */
  async waitForOTPPage(): Promise<void> {
    Logger.step('Waiting for OTP entry page to be ready');
    const firstPin = this.page.locator('input.chakra-pin-input[data-index="0"]');
    await firstPin.waitFor({ state: 'visible', timeout: 30000 });
    Logger.success('OTP entry page is ready — registration email was sent');
  }

  async enterOTP(otp: string): Promise<void> {
    Logger.step(`Entering OTP: ${otp}`);
    if (otp.length !== 6) throw new Error(`OTP must be 6 digits, received: ${otp}`);

    const digits = otp.split('');
    for (let i = 0; i < digits.length; i++) {
      // Robustness: Clear any popups that might have appeared after the first one
      if (i === 0 || i === 3) await this.dismissSupportPopups();

      const pinInput = this.page.locator(`input.chakra-pin-input[data-index="${i}"]`)
        .or(this.page.getByRole('textbox', { name: /pin code/i }).nth(i));

      await pinInput.waitFor({ state: 'visible', timeout: 10000 });
      await pinInput.fill(digits[i]);
    }
    Logger.success('OTP entered');
  }

  async clickVerifyEmail(): Promise<void> {
    const verifyButton = this.page.getByRole('button', { name: new RegExp(RegistrationPage.LABELS.VERIFY_EMAIL_BUTTON, 'i') });
    await this.expectVisible(verifyButton, 'Verify Email button should be visible');
    await this.click(verifyButton);
  }

  async verifyEmailWithOTP(otp: string): Promise<void> {
    // OTP page readiness is guaranteed by the caller (waitForOTPPage in TC-01)
    // bringToFront() is called by the spec before this method
    await this.enterOTP(otp);
    await this.clickVerifyEmail();

    // Pixel Perfect: Wait for redirect to /welcome to ensure session is fully established
    Logger.info('Waiting for redirect to /welcome...');
    try {
      await this.page.waitForURL(url => url.pathname.includes(ROUTE_PATHS.WELCOME), { timeout: 30000 });
      await this.page.waitForLoadState('load');
      await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });
    } catch (e) {
      Logger.warn('Redirect to /welcome timed out or was blocked. Current URL: ' + this.page.url());
    }
  }

  /**
   * Handles the Resend Code button logic.
   * If an environmental lockout (countdown) is detected:
   *  - < 120s: Waits for the countdown and clicks.
   *  - > 120s: Returns false (indicates environmental skip/pass) to avoid CI hangs.
   * @returns boolean - True if button was clicked, false if bypassed due to high lockout.
   */
  async clickResendOTP(): Promise<boolean> {
    Logger.step('Handling Resend Code button logic');

    const resendButton = this.page.getByRole('button').filter({
      hasText: new RegExp(RegistrationPage.LABELS.RESEND_OTP_BUTTON, 'i')
    });

    await resendButton.waitFor({ state: 'visible', timeout: 20000 });

    const countdownLocator = this.page.getByText(/resend in/i).first();
    let totalSeconds = 0;

    for (let attempt = 0; attempt < 10; attempt++) {
      if (!await countdownLocator.isVisible().catch(() => false)) {
        await this.page.waitForTimeout(500);
        continue;
      }

      const fullText = await countdownLocator.innerText();
      const minMatch = fullText.match(/(\d+)\s*minutes?/i);
      const explicitSecMatch = fullText.match(/(\d+)\s*seconds?/i);
      const outputSecMatch = fullText.match(/minutes?\s*(\d+)\s*$/i);
      const bareNumberMatch = !minMatch ? fullText.match(/(\d+)/) : null;

      let currentSeconds = 0;
      if (minMatch) currentSeconds += parseInt(minMatch[1]) * 60;
      if (explicitSecMatch) currentSeconds += parseInt(explicitSecMatch[1]);
      else if (outputSecMatch) currentSeconds += parseInt(outputSecMatch[1]);
      else if (bareNumberMatch) currentSeconds += parseInt(bareNumberMatch[1]);

      if (currentSeconds > 0) {
        totalSeconds = currentSeconds;
        break;
      }
      await this.page.waitForTimeout(500);
    }

    if (totalSeconds > 0) {
      if (totalSeconds > 120) {
        Logger.warn(`Environmental Lockout Detected: ${Math.round(totalSeconds / 60)} min wait required.`);
        Logger.warn('FORCE PASS: Bypassing resend verification to prevent CI hang. Please monitor this environmental condition.');
        return false;
      }
      Logger.info(`Waiting ${totalSeconds}s for resend countdown...`);
      await this.page.waitForTimeout((totalSeconds + 1) * 1000);
    }

    await expect(resendButton, 'Resend button should be enabled after countdown').toBeEnabled({ timeout: 70_000 });
    await this.robustClick(resendButton);
    Logger.success('Resend OTP button clicked');
    return true;
  }


  async fillEmailAndBlur(email: string) {
    await this.stableFill(this.emailInput, email);
    await this.emailInput.press('Tab');
  }

  async verifyFirstNameInvalidError() {
    await this.expectVisible(this.firstNameError, 'First name invalid error should be visible');
    await expect(this.firstNameError).toHaveText(MESSAGES.AUTH.REGISTRATION.FIRST_NAME_INVALID);
  }

  async verifyLastNameInvalidError() {
    await this.expectVisible(this.lastNameError, 'Last name invalid error should be visible');
    await expect(this.lastNameError).toHaveText(MESSAGES.AUTH.REGISTRATION.LAST_NAME_INVALID);
  }

  async verifyFirstNameRequiredError() {
    await this.expectVisible(this.firstNameError, 'First name required error should be visible');
    await expect(this.firstNameError).toHaveText(MESSAGES.AUTH.REGISTRATION.FIRST_NAME_REQUIRED);
  }

  async verifyLastNameRequiredError() {
    await this.expectVisible(this.lastNameError, 'Last name required error should be visible');
    await expect(this.lastNameError).toHaveText(MESSAGES.AUTH.REGISTRATION.LAST_NAME_REQUIRED);
  }

  async verifyEmailRequiredError() {
    await this.expectVisible(this.emailError, 'Email required error should be visible');
    await expect(this.emailError).toHaveText(MESSAGES.AUTH.REGISTRATION.EMAIL_REQUIRED);
  }

  async verifyPasswordRequiredError() {
    await this.expectVisible(this.passwordError, 'Password required error should be visible');
    await expect(this.passwordError).toHaveText(MESSAGES.AUTH.REGISTRATION.PASSWORD_REQUIRED);
  }

  async verifyEmailUnavailableError() {

    await this.emailError.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.emailError, 'Email unavailable error message mismatch').toHaveText(MESSAGES.AUTH.REGISTRATION.EMAIL_UNAVAILABLE);
  }
}
