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
test.describe.serial('Leader Flow - Free Subscription', { tag: ['@smoke', '@leader'] }, () => {
    let context: any;
    let page: any;
    let email: string;
    let groupName: string;

    test.beforeAll(async ({ browser }, testInfo) => {
        const use = testInfo.project.use;
        context = await browser.newContext({
            ...use,
            // Only recordVideo needs explicit mapping — Playwright auto-manages tracing in test hooks
            ...(use.video && use.video !== 'off'
                ? { recordVideo: { dir: testInfo.outputPath('videos') } }
                : {}),
        });
        page = await context.newPage();
        email = DataGenerator.email();
        groupName = DataGenerator.generateGroupName();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('Step 1: Registration - Create new leader account', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LFF-01' });
        await LeaderHelper.registerNewLeader(page, context, email);
    });

    test('Step 2: Welcome - Select leader role', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LFF-02' });
        await LeaderHelper.selectRoleAndContinue(page);
    });

    test('Step 3: Onboarding - Skip to Hosting Plan', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LFF-03' });
        await LeaderHelper.completeOnboardingViaSkip(page);
    });

    test('Step 4: Hosting Plan - Select Free plan', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LFF-04' });
        const hostingPage = new HostingPlanPage(page);
        await hostingPage.verifyPageLoaded();
        await hostingPage.selectFreePlan();
    });

    test('Step 5: Free Group Popup - Dismiss and proceed', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LFF-05' });
        const freePopup = new FreeGroupPopup(page);
        await freePopup.verifyVisible();
        await freePopup.clickGoToGroup();

        // After dismissal, we might land on Dashboard or Create Group Page.
        // We handle navigation explicitly in the next step via GroupHelper.
        Logger.info('Free Group Popup dismissed. Proceeding to Group Creation.');
    });

    test('Step 6: Group - Create group and verify success', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LFF-06' });
        // GroupHelper.createGroup handles navigation from Dashboard to /groups/create if needed.
        await GroupHelper.createGroup(page, groupName);
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.GROUPS.CREATED_SUCCESS, 'i'));
        Logger.success(`Leader Free Flow Complete: Group "${groupName}" created.`);
    });
});
