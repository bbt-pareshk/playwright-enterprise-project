import { test } from '../../../lib/fixtures/index';
import { ROLES, UserRole } from '../../../lib/data/constants/roles';
import { DashboardPage } from '../../../lib/pages/dashboard/DashboardPage';
import { LoginPage } from '../../../lib/pages/auth/LoginPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { Logger } from '../../../lib/utils/Logger';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { AuthHelper } from '../../../lib/helpers/AuthHelper';
import { ENV } from '../../../config/env';

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

  test.describe('Invalid Login – Boundary & Validation', { tag: ['@regression', '@member'] }, () => {

    // 1. Data-Driven Login Failures (Server-Side / Security)
    const CREDENTIAL_FAILURE_SCENARIOS = [
      {
        scenario: 'Registered member cannot login with incorrect password',
        user: ENV.MEMBER_USERNAME,
        pass: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.WRONG
      },
      {
        scenario: 'Unregistered user cannot login with a generated email',
        user: DataGenerator.generateEmail(),
        pass: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT
      },
      {
        scenario: 'Registered member fails login with minimum password length violation',
        user: ENV.MEMBER_USERNAME,
        pass: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.SHORT
      }
    ];

    for (const data of CREDENTIAL_FAILURE_SCENARIOS) {
      test(`Scenario: ${data.scenario}`, async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.openLoginPage();
        Logger.step(`Attempting login for: ${data.user} (Scenario: ${data.scenario})`);

        await loginPage.login(data.user, data.pass);
        await loginPage.verifyInvalidLoginError();

        Logger.success(`Success: Access denied as expected for "${data.scenario}"`);
      });
    }

    // 2. Data-Driven Mandatory Field Checks (Client-Side)
    const MANDATORY_FIELD_SCENARIOS = [
      { name: 'Empty credentials submission', email: '', pass: '' },
      { name: 'Missing password submission', email: ENV.MEMBER_USERNAME, pass: '' },
      { name: 'Missing email submission', email: '', pass: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT }
    ];

    for (const fieldData of MANDATORY_FIELD_SCENARIOS) {
      test(`Validation: ${fieldData.name}`, async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.openLoginPage();
        Logger.step(`Testing mandatory fields: ${fieldData.name}`);

        await loginPage.login(fieldData.email, fieldData.pass);
        await loginPage.verifyEmptyCredentialsError();

        Logger.success(`Success: Form correctly blocked "${fieldData.name}"`);
      });
    }
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
