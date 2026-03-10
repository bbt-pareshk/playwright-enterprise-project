import { test } from '../../../lib/fixtures/index';
import { DashboardPage } from '../../../lib/pages/dashboard/DashboardPage';
import { MyGroupsPage } from '../../../lib/pages/dashboard/MyGroupsPage';
import { ProfilePaymentPage } from '../../../lib/pages/profile/ProfilePaymentPage';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Navigation Integrity Audit
 * ----------------------------
 * Validates that all core authenticated sections of the application are accessible 
 * and render correctly for different user roles.
 * 
 * PERFORMANCE OPTIMIZATION:
 * 1. Parallel Architecture: Uses multiple atomic test() blocks to enable worker concurrency.
 * 2. Coverage Expansion: Verifies Dashboard, My Groups, Explore, and Profile in parallel.
 * 3. Tag Adherence: Preserves existing @smoke, @leader, and @member tags for runtime filtering.
 */
test.describe('Navigation Integrity Audit', { tag: ['@smoke'] }, () => {

    test.describe('Leader Profile Navigation', { tag: ['@leader'] }, () => {

        test('NAV-L-01: Verify Dashboard access', async ({ leaderPage }) => {
            const dashboard = new DashboardPage(leaderPage);
            await dashboard.open();
            await dashboard.verifyDashboardLoaded();
            Logger.success('Leader Dashboard verified');
        });

        test('NAV-L-02: Verify My Groups listing', async ({ leaderPage }) => {
            const myGroups = new MyGroupsPage(leaderPage);
            await myGroups.openMyGroups(true);
            await myGroups.clickJoinedGroupsTab();
            Logger.success('Leader My Groups sections verified');
        });

        test('NAV-L-03: Verify Explore access', async ({ leaderPage }) => {
            const dashboard = new DashboardPage(leaderPage);
            await dashboard.open();
            await dashboard.verifyDashboardLoaded();
            await dashboard.clickFindSupportGroup();
            await leaderPage.waitForURL(/.*\/groups\/?$/);
            Logger.success('Leader Explore section verified');
        });

        test('NAV-L-04: Verify Profile & Billing access', async ({ leaderPage }) => {
            const profilePayment = new ProfilePaymentPage(leaderPage);
            await profilePayment.openProfilePaymentPage();
            Logger.success('Leader Billing/Profile section verified');
        });
    });

    test.describe('Member Profile Navigation', { tag: ['@member'] }, () => {

        test('NAV-M-01: Verify Dashboard access', async ({ memberPage }) => {
            const dashboard = new DashboardPage(memberPage);
            await dashboard.open();
            await dashboard.verifyDashboardLoaded();
            Logger.success('Member Dashboard verified');
        });

        test('NAV-M-02: Verify Joined Groups listing', async ({ memberPage }) => {
            const myGroups = new MyGroupsPage(memberPage);
            await myGroups.openMyGroups(true);
            await myGroups.clickJoinedGroupsTab();
            Logger.success('Member Joined Groups sections verified');
        });

        test('NAV-M-03: Verify Explore access', async ({ memberPage }) => {
            const dashboard = new DashboardPage(memberPage);
            await dashboard.open();
            await dashboard.verifyDashboardLoaded();
            await dashboard.clickFindSupportGroup();
            await memberPage.waitForURL(/.*\/groups\/?$/);
            Logger.success('Member Explore section verified');
        });
    });
});
