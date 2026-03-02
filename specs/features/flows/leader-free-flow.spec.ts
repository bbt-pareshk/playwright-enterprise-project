import { test } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { GroupHelper } from '../../../lib/helpers/GroupHelper';
import { HostingPlanPage } from '../../../lib/pages/hosting/HostingPlanPage';
import { FreeGroupPopup } from '../../../lib/pages/hosting/FreeGroupPopup';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { MESSAGES } from '../../../lib/data/constants/messages';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Leader Full Flow - Free Plan
 * ----------------------------
 * Validates the free plan journey for a Leader, continuing to group creation.
 */
test.describe.serial('Leader Full Flow - Free Plan @smoke @critical @leader @e2e', () => {
    let context: any;
    let page: any;
    let email: string;
    let groupName: string;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        email = DataGenerator.email();
        groupName = DataGenerator.generateGroupName();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('TC-LFF-01: Register new Leader & Verify Email', async () => {
        await LeaderHelper.registerNewLeader(page, context, email);
    });

    test('TC-LFF-02: Welcome page -> Role Selection', async () => {
        await LeaderHelper.selectRoleAndContinue(page);
    });

    test('TC-LFF-03: Onboarding -> Skip Path to Pricing', async () => {
        await LeaderHelper.completeOnboardingViaSkip(page);
    });

    test('TC-LFF-04: Hosting Plan -> Select Free Plan', async () => {
        const hostingPage = new HostingPlanPage(page);
        await hostingPage.verifyPageLoaded();
        await hostingPage.selectFreePlan();
    });

    test('TC-LFF-05: Free Group Popup -> Dismiss and Proceed', async () => {
        const freePopup = new FreeGroupPopup(page);
        await freePopup.verifyVisible();
        await freePopup.clickGoToGroup();

        // After dismissal, we might land on Dashboard or Create Group Page.
        // We handle navigation explicitly in the next step via GroupHelper.
        Logger.info('Free Group Popup dismissed. Proceeding to Group Creation.');
    });

    test('TC-LFF-06: Complete Group Creation & Verify Success', async () => {
        // GroupHelper.createGroup handles navigation from Dashboard to /groups/create if needed.
        await GroupHelper.createGroup(page, groupName);
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.GROUPS.CREATED_SUCCESS, 'i'));
        Logger.success(`Leader Free Flow Complete: Group "${groupName}" created.`);
    });
});
