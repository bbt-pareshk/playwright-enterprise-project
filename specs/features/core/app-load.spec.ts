import { test } from '../../../lib/fixtures/index';
import { Logger } from '../../../lib/utils/Logger';
import { LoginPage } from '../../../lib/pages/auth/LoginPage';

/* =========================================================
   App Load – Core
   Verifies staging application load and Login page visibility.
========================================================= */
test.describe('App Load', () => {

  test(
    'Application loads successfully',
    { tag: ['@smoke', '@critical'] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);

      // 1. Navigate to the Staging/Base URL
      Logger.step('Navigating to Login page');
      await loginPage.openLoginPage();

      // 2. Verify the "Login" heading is visible
      Logger.step('Verifying "Login" text visibility');
      await loginPage.verifyLoginPageVisible();

      // 3. Confirm App Load success
      Logger.success('App Load › Application loads successfully (Login page visible)');
    }
  );
});
