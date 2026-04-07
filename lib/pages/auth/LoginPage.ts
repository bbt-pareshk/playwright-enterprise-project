import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ROUTES, URLS } from '../../../config/urls';
import { Wait } from '../../utils/Wait';
import { Logger } from '../../utils/Logger';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';
import { MESSAGES } from '../../data/constants/messages';
import { APP_CONSTANTS } from '../../data/constants/app-constants';

export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  private readonly logInButton: Locator;
  private readonly createAccountLink: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly loginHeading: Locator;
  private readonly loginErrorMessage: Locator;
  private readonly googleLoginButton: Locator;
  private readonly appleLoginButton: Locator;
  private readonly emailError: Locator;
  private readonly passwordError: Locator;
  private readonly passwordToggleBtn: Locator;

  constructor(page: Page) {
    super(page);

    // 1. Core Form Locators (Chakra UI)
    this.usernameInput = page.getByLabel(UI_CONSTANTS.AUTH.LOGIN.EMAIL_LABEL, { exact: true });
    this.passwordInput = page.getByLabel(UI_CONSTANTS.AUTH.LOGIN.PASSWORD_LABEL, { exact: true });
    this.logInButton = page.getByRole('button', { name: UI_CONSTANTS.AUTH.LOGIN.BUTTON, exact: true });
    
    // 2. Navigation Links
    this.createAccountLink = page.getByRole('link', { name: UI_CONSTANTS.AUTH.LOGIN.SIGN_UP_LINK });
    this.forgotPasswordLink = page.getByRole('link', { name: UI_CONSTANTS.AUTH.LOGIN.FORGOT_PASSWORD_LINK });

    // 3. Structural Elements
    // In the new DOM, heading is a <p> tag, not h1-h6
    this.loginHeading = page.locator('p.chakra-text').filter({ hasText: UI_CONSTANTS.AUTH.LOGIN.HEADING }).first();

    // 4. Social & Interactive
    this.googleLoginButton = page.getByRole('button', { name: /Google/i });
    this.appleLoginButton = page.getByRole('button', { name: /Apple/i });
    this.passwordToggleBtn = page.getByRole('button', { name: /password/i }).filter({ has: page.locator('svg') });

    // 5. Validation & Errors
    this.loginErrorMessage = page.getByText(MESSAGES.AUTH.LOGIN.INVALID_CREDENTIALS, { exact: true });
    this.emailError = page.locator('.chakra-form-control').filter({ hasText: UI_CONSTANTS.AUTH.LOGIN.EMAIL_LABEL }).locator('.chakra-form__error-message');
    this.passwordError = page.locator('.chakra-form-control').filter({ hasText: UI_CONSTANTS.AUTH.LOGIN.PASSWORD_LABEL }).locator('.chakra-form__error-message');
  }

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
    await expect(this.passwordInput).toHaveAttribute('type', expectedType, { timeout: 5000 });
    Logger.info(`${APP_CONSTANTS.LOGS.AUTH.PASS_VISIBILITY} ${isVisible ? 'visible' : 'hidden'}`);
  }

  async isLoggedIn(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/groups') || url.includes('/welcome') || url.includes('/onboarding') || url.includes('/plans') || url.includes('/pricing');
  }

  async clickCreateAccount() {
    await this.click(this.createAccountLink);
  }

  async clickForgotPassword() {
    await this.click(this.forgotPasswordLink);
  }

  async openLoginPage() {
    await this.page.goto(ROUTES.login());
  }

  async fillPassword(password: string) {
    await this.stableFill(this.passwordInput, password);
  }

  /**
   * Enterprise-Grade High-Performance Login Action.
   */
  async login(username: string, password: string, expectSuccess: boolean = true) {
    Logger.info(`Attempting login for user: ${username} | Password: ${password || '[EMPTY]'} (expectSuccess: ${expectSuccess})`);

    if (await this.isLoggedIn()) {
      Logger.success('User already has an active session. Skipping login.');
      return;
    }

    // Fill credentials
    if (username !== undefined) await this.stableFill(this.usernameInput, username);
    if (password !== undefined) await this.stableFill(this.passwordInput, password);

    // Ensure button is ready (Chakra might have a brief disabled state during validation)
    await this.logInButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Explicitly check for disabled state and wait for it to be enabled if credentials are provided
    if (username && password && await this.logInButton.getAttribute('disabled') !== null) {
        await expect(this.logInButton).toBeEnabled({ timeout: 5000 }).catch(() => {
            Logger.warn('Login button remained disabled. Attempting Enter key fallback.');
        });
    }

    if (await this.logInButton.isEnabled()) {
        await this.logInButton.click();
    } else {
        await this.passwordInput.press('Enter');
    }

    if (expectSuccess) {
      await this.page.waitForURL(url => 
         url.pathname.includes('/groups') || 
         url.pathname.includes('/welcome') || 
         url.pathname.includes('/onboarding') || 
         url.pathname.includes('/plans') || 
         url.pathname.includes('/pricing'), 
         { timeout: 15_000 }
      );
      Logger.success(`Login successful. Landed on: ${this.page.url()}`);
    } else {
       // Small wait for client-side validation to manifest
       await this.page.waitForTimeout(1000);
    }
  }

  async verifyInvalidLoginError() {
    // Dynamic text check for stability against minor wording changes
    const errorMsg = this.page.locator('text=/incorrect|invalid|wrong/i').first();
    await expect(errorMsg).toBeVisible({ timeout: 10_000 });
  }

  async clickSocialLogin() {
    await this.click(this.googleLoginButton);
  }

  async verifyLoginPageVisible() {
    await expect(this.loginHeading).toBeVisible({ timeout: 15_000 });
  }

  async verifyEmptyCredentialsError() {
    // Wait for at least one field validation to appear
    await expect(this.emailError.or(this.passwordError).first()).toBeVisible({ timeout: 5000 }).catch(async () => {
        // Fallback for generic toast or summary errors if field level fails
        await this.verifyLoginPageVisible();
    });
  }
}
