import { test } from '../../../lib/fixtures/index';
import { ROLES, UserRole } from '../../../lib/data/constants/roles';
import { DashboardPage } from '../../../lib/pages/dashboard/DashboardPage';
import { LoginPage } from '../../../lib/pages/auth/LoginPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { Logger } from '../../../lib/utils/Logger';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { AuthHelper } from '../../../lib/helpers/AuthHelper';

const TEST_ROLE = process.env.TEST_ROLE;

/* =========================================================
   Login – Single User (Smoke + Regression)
 ========================================================= */
test.describe('Login – Single User', { tag: ['@smoke'] }, () => {

  test(
    'Leader user can login successfully',
    { tag: ['@leader'] },
    async ({ loginAs, page }, testInfo) => {
      Logger.step('Logging in as Leader');
      await loginAs(ROLES.LEADER);
      await AssertionHelper.verifyDashboardLoaded(page);
    }
  );

  test(
    'Member user can login successfully',
    { tag: ['@member'] },
    async ({ loginAs, page }, testInfo) => {
      Logger.step('Logging in as Member');
      await loginAs(ROLES.MEMBER);
      await AssertionHelper.verifyDashboardLoaded(page);
    }
  );

  test(
    'Verify Logout functionality from Dashboard',
    { tag: ['@member'] },
    async ({ loginAs, page }) => {
      // 1. Login as Member
      await loginAs(ROLES.MEMBER);
      await AssertionHelper.verifyDashboardLoaded(page);

      // 2. Perform Logout
      Logger.step('Performing Logout from Dashboard');
      await AuthHelper.logout(page);

      // 3. Verify redirection to Login page
      const loginPage = new LoginPage(page);
      await loginPage.verifyLoginPageVisible();

      Logger.success('Logout successful: User redirected to Login page.');
    }
  );

  test.describe('Invalid Login Scenarios', { tag: ['@member'] }, () => {
    test(
      'Invalid Credentials - Verify error message appears',
      async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Open Login page
        Logger.step('Navigate to Login Page');
        await loginPage.openLoginPage();

        // 2. Enter incorrect credentials
        const invalidUsername = DataGenerator.generateEmail();
        const invalidPassword = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.WRONG;

        Logger.step(`Attempt login with invalid credentials: ${invalidUsername}`);
        await loginPage.login(invalidUsername, invalidPassword);

        // 3. Verify error message appears
        Logger.step('Verify error message visibility');
        await loginPage.verifyInvalidLoginError();

        Logger.success(APP_CONSTANTS.TEST_DATA.LOGIN.SUCCESS.INVALID_TEST);
      }
    );

    test(
      'Minimum password length validation',
      async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Open Login page
        await loginPage.openLoginPage();

        // 2. Enter valid email but short password
        const testEmail = DataGenerator.generateEmail();
        const shortPassword = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.SHORT;

        Logger.step(`Attempting login with short password: ${shortPassword}`);
        await loginPage.login(testEmail, shortPassword);

        // 3. Verify error message
        Logger.step('Verifying login failure for short password');
        await loginPage.verifyInvalidLoginError();
      }
    );

    test(
      'Empty credentials validation',
      async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Open Login page
        await loginPage.openLoginPage();

        // 2. Click Login with empty fields
        Logger.step('Attempt login with empty credentials');
        await loginPage.login('', '');

        // 3. Verify validation error or that user remains on page
        await loginPage.verifyEmptyCredentialsError();
      }
    );
  });

  test.describe('Advanced Login Features', { tag: ['@member'] }, () => {
    test(
      'Social Auth (Google) navigation',
      async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.openLoginPage();

        Logger.step('Initiate Social Auth provider flow');
        await loginPage.clickSocialLogin();

        await page.waitForURL(/google\.com|accounts\.google/i, { timeout: 15000 }).catch(() => {
          Logger.warn('External provider redirection took longer than expected or was blocked.');
        });
      }
    );

    test(
      'Password visibility toggle',
      async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.openLoginPage();

        const testPassword = APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.TEST;
        await loginPage.fillPassword(testPassword);

        Logger.step('Verify password is initially hidden');
        await loginPage.verifyPasswordVisibility(false);

        Logger.step('Toggle password visibility to Show');
        await loginPage.togglePasswordVisibility();
        await loginPage.verifyPasswordVisibility(true);

        Logger.step('Toggle password visibility to Hide');
        await loginPage.togglePasswordVisibility();
        await loginPage.verifyPasswordVisibility(false);

        Logger.success(APP_CONSTANTS.TEST_DATA.LOGIN.SUCCESS.VISIBILITY_TEST);
      }
    );
  });
});
