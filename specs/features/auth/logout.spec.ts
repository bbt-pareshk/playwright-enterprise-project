import { test, expect } from '../../../lib/fixtures/index';
import { AuthHelper } from '../../../lib/helpers/AuthHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { NavigationHelper } from '../../../lib/helpers/NavigationHelper';
import { Logger } from '../../../lib/utils/Logger';
import { ENV } from '../../../config/env';
import { URLS } from '../../../config/urls';

test.describe('Logout – User can log out and access is revoked', () => {

    test(
        'Logout Flow',
        { tag: ['@smoke', '@critical'] },
        async ({ memberPage }) => {
            // 1. Ensure on Dashboard
            await NavigationHelper.gotoDashboard(memberPage);
            await AssertionHelper.verifyDashboardLoaded(memberPage);

            // 2. Perform Logout
            await AuthHelper.logout(memberPage);

            // 3. Verify redirection to Login page
            const expectedLoginUrl = `${ENV.BASE_URL}${URLS.LOGIN}`;
            await expect(memberPage).toHaveURL(expectedLoginUrl, { timeout: 15000 });

            Logger.success('Logout test case passed: User successfully logged out');
        }
    );
});

