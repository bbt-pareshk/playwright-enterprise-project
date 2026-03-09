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
 * Leader Journey: Free Plan
 * ------------------------
 * Validates the complete end-to-end journey for a Leader on the Free plan.
 * From registration to successful group creation.
 *
 * DESIGN PRINCIPLES:
 * 1. Journey Architecture: Single test() block using test.step() for better traces.
 * 2. Robustness: Uses centralized Helpers (Leader, Group) for reliability.
 */
test.describe('Leader Journey - Free Subscription', { tag: ['@smoke', '@leader'] }, () => {

    test('Leader Journey: Registration -> Onboarding -> Free Plan -> Group Creation', async ({ page, context }) => {
        const email = DataGenerator.email();
        const groupName = DataGenerator.generateGroupName();

        await test.step('LEADER-FREE-01: Registration - Fresh account creation', async () => {
            await LeaderHelper.registerNewLeader(page, context, email);
        });

        await test.step('LEADER-FREE-02: Welcome - Role Selection (Leader)', async () => {
            await LeaderHelper.selectRoleAndContinue(page);
        });

        await test.step('LEADER-FREE-03: Onboarding - Skip to Hosting Plan', async () => {
            await LeaderHelper.completeOnboardingViaSkip(page);
        });

        await test.step('LEADER-FREE-04: Hosting Plan - Free Plan Selection', async () => {
            const hostingPage = new HostingPlanPage(page);
            await hostingPage.verifyPageLoaded();
            await hostingPage.selectFreePlan();

            const freePopup = new FreeGroupPopup(page);
            await freePopup.verifyVisible();
            await freePopup.clickGoToGroup();
        });

        await test.step('LEADER-FREE-05: Group Creation - Create and verify first group', async () => {
            await GroupHelper.createGroup(page, groupName);
            await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.GROUPS.CREATED_SUCCESS, 'i'));
            Logger.success(`Leader Free Plan Journey complete: Group "${groupName}" created.`);
        });
    });
});
