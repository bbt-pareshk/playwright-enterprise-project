import { test } from '../../../lib/fixtures/index';

import { DashboardPage } from '../../../lib/pages/dashboard/DashboardPage';
import { LoginPage } from '../../../lib/pages/auth/LoginPage';
import { URLS } from '../../../config/urls';
import { Logger } from '../../../lib/utils/Logger';


/* =========================================================
   Dashboard loads after fresh login (Smoke + Regression)
========================================================= */

test(
  'Dashboard loads successfully for authenticated leader',
  { tag: ['@smoke', '@critical'] },
  async ({ leaderPage }, testInfo) => {

    testInfo.annotations.push(
      { type: 'severity', description: 'critical' }
    );

    const dashboard = new DashboardPage(leaderPage);
    await leaderPage.goto(URLS.DASHBOARD);
    await dashboard.verifyDashboardLoaded();

    Logger.success('Dashboard Page loaded correctly for Leader');
  }
);
