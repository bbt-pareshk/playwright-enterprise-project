import { test } from '../../../lib/fixtures/index';
import { DashboardPage } from '../../../lib/pages/dashboard/DashboardPage';
import { MyGroupsPage } from '../../../lib/pages/dashboard/MyGroupsPage';
import { ProfilePaymentPage } from '../../../lib/pages/profile/ProfilePaymentPage';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Navigation Integrity Journey
 * ----------------------------
 * Validates that all core authenticated sections of the application are accessible 
 * and render correctly for different user roles.
 * 
 * DESIGN PRINCIPLES:
 * 1. Journey Architecture: Single test per role using test.step() for efficiency.
 * 2. Coverage Expansion: Verifies Dashboard, My Groups, Explore, and Profile.
 * 3. Tag Adherence: Uses existing @smoke, @leader, and @member tags.
 */
test.describe('Navigation Integrity Journey', { tag: ['@smoke'] }, () => {

    test('Leader Core Navigation Integrity', { tag: ['@leader'] }, async ({ leaderPage }) => {
        const dashboard = new DashboardPage(leaderPage);
        const myGroups = new MyGroupsPage(leaderPage);
        const profilePayment = new ProfilePaymentPage(leaderPage);

        await test.step('NAV-L-01: Verify Dashboard access', async () => {
            await dashboard.open();
            await dashboard.verifyDashboardLoaded();
            Logger.success('Leader Dashboard verified');
        });

        await test.step('NAV-L-02: Verify My Groups listing', async () => {
            await myGroups.openMyGroups(true);
            await myGroups.clickJoinedGroupsTab();
            Logger.success('Leader My Groups sections verified');
        });

        await test.step('NAV-L-03: Verify Explore (Find Support Group) access', async () => {
            await dashboard.open();
            await dashboard.clickFindSupportGroup();
            await leaderPage.waitForURL(/.*\/groups\/?$/);
            Logger.success('Leader Explore section verified');
        });

        await test.step('NAV-L-04: Verify Profile & Billing access', async () => {
            await profilePayment.openProfilePaymentPage();
            Logger.success('Leader Billing/Profile section verified');
        });
    });

    test('Member Core Navigation Integrity', { tag: ['@member'] }, async ({ memberPage }) => {
        const dashboard = new DashboardPage(memberPage);
        const myGroups = new MyGroupsPage(memberPage);

        await test.step('NAV-M-01: Verify Dashboard access', async () => {
            await dashboard.open();
            await dashboard.verifyDashboardLoaded();
            Logger.success('Member Dashboard verified');
        });

        await test.step('NAV-M-02: Verify Joined Groups listing', async () => {
            await myGroups.openMyGroups(true);
            await myGroups.clickJoinedGroupsTab();
            Logger.success('Member Joined Groups sections verified');
        });

        await test.step('NAV-M-03: Verify Explore access', async () => {
            await dashboard.open();
            await dashboard.clickFindSupportGroup();
            await memberPage.waitForURL(/.*\/groups\/?$/);
            Logger.success('Member Explore section verified');
        });
    });
});
