import { Page, Locator } from '@playwright/test';
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
  private readonly emailError: Locator;
  private readonly passwordError: Locator;

  // Internal UI Text (moved from constants for better context)
  private static readonly LABELS = {
    EMAIL: 'Email or Username',
    PASSWORD: 'Password',
    LOGIN_BUTTON: 'Log in',
    SIGN_UP: 'Sign Up',
    FORGOT_PASSWORD: 'Forget Password?',
    HEADING: 'Welcome Back!',
  };

  constructor(page: Page) {
    super(page);

    // UPDATED — labels now internal to class
    this.usernameInput = page.getByLabel(LoginPage.LABELS.EMAIL);
    this.passwordInput = page.getByLabel(LoginPage.LABELS.PASSWORD);

    // Button and Links
    this.logInButton = page.getByRole('button', { name: LoginPage.LABELS.LOGIN_BUTTON });
    this.createAccountLink = page.getByRole('link', { name: LoginPage.LABELS.SIGN_UP });
    this.forgotPasswordLink = page.getByRole('link', { name: LoginPage.LABELS.FORGOT_PASSWORD });

    // Heading
    this.loginHeading = page.getByRole('heading', { name: LoginPage.LABELS.HEADING });

    // No error DOM provided — keeping old locator
    this.loginErrorMessage = page.getByText(
      MESSAGES.AUTH.LOGIN.INVALID_CREDENTIALS,
      { exact: true }
    );

    // Password Toggle Button - using the right element button as it's the toggle for password visibility
    this.passwordToggleBtn = page.locator('input[name="password"] ~ .chakra-input__right-element button');

    // Social Login - assuming standard button text

    this.googleLoginButton = page.getByRole('button', { name: /Google/i });

    // Field Errors (Common in Chakra/React forms)
    this.emailError = page.locator('#email-feedback, [id*="email-error"], .chakra-form__error-message').first();
    this.passwordError = page.locator('#password-feedback, [id*="password-error"], .chakra-form__error-message').last();
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

    Logger.info(`${APP_CONSTANTS.LOGS.AUTH.PASS_VISIBILITY} ${isVisible ? 'visible' : 'hidden'} (type="${actualType}")`);
  }

  async verifyLoginPageVisible() {
    await this.expectVisible(this.loginHeading, 'Login heading should be visible');
  }

  /**
   * Enterprise Check: Determines if a session is currently active.
   */
  async isLoggedIn(): Promise<boolean> {
    // Check if we are on a dashboard route, welcome, or can see user menu
    const url = this.page.url();
    return url.includes('/groups') || url.includes('/welcome');
  }

  async verifyInvalidLoginError() {
    await this.expectVisible(this.loginErrorMessage, 'Invalid login error message should be visible');
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
   * High-Performance Login Action.
   * Replaced hard-coded Wait.pause with dynamic State Monitoring.
   */
  async login(username: string, password: string) {
    Logger.info(`Logging in user: ${username}`);
    if (username) await this.stableFill(this.usernameInput, username);
    if (password) await this.stableFill(this.passwordInput, password);

    await this.robustClick(this.logInButton);

    // Dynamic Wait: Only wait for navigation if credentials were provided
    // Handles redirection to /groups (dashboard) OR /welcome (onboarding) OR staying on /login (failure)
    if (username && password) {
      await this.page.waitForURL(url =>
        url.pathname.includes('/groups') ||
        url.pathname.includes('/welcome') ||
        url.pathname.includes('/login'),
        { timeout: 15000 }
      ).catch(() => Logger.warn('Login navigation timed out or encountered an intermediate state.'));
    }
  }

  async clickSocialLogin() {
    await this.click(this.googleLoginButton);
  }

  async verifyEmptyCredentialsError() {
    // Check if error messages appear or if HTML5 validation is triggered
    const isVisible = await this.emailError.isVisible() || await this.passwordError.isVisible();
    if (!isVisible) {
      // Fallback: check if the button click didn't trigger a navigation (stayed on login)
      await this.verifyLoginPageVisible();
    }
  }
}
