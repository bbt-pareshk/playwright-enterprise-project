import { Page } from '@playwright/test';
import { APP_CONSTANTS } from '../data/constants/app-constants';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { CreateGroupPage } from '../pages/group/CreateGroupPage';
import { MyGroupsPage } from '../pages/dashboard/MyGroupsPage';
import { GroupActivationPaymentPage } from '../pages/payment/GroupActivationPaymentPage';
import { DataGenerator } from '../utils/DataGenerator';
import { Logger } from '../utils/Logger';
import { NavigationHelper } from './NavigationHelper';

/**
 * GroupHelper
 * -----------
 * Encapsulates group-related business flows.
 */
export class GroupHelper {

    /**
     * Performs the full flow of creating a new group.
     */
    static async createGroup(page: Page, groupName: string) {
        Logger.step(`Creating group: ${groupName}`);

        await NavigationHelper.gotoDashboard(page);
        const dashboard = new DashboardPage(page);
        await dashboard.clickStartGroup();

        // Wait for navigation to settle
        await page.waitForURL(/\/groups\/create/, { timeout: 20_000 });

        const createGroup = new CreateGroupPage(page);
        await createGroup.verifyPageLoaded();
        await createGroup.enterGroupDetails(
            groupName,
            DataGenerator.description(),
            APP_CONSTANTS.TEST_DATA.DEFAULTS.DEFAULT_SCHEDULE
        );
        await createGroup.selectRandomTag();
        await createGroup.submitGroup();
        await createGroup.confirmSubmit();

        Logger.success(`Group creation flow initiated for: ${groupName}`);
    }

    /**
     * Performs the group activation/payment flow.
     */
    static async activateGroup(page: Page, groupName: string) {
        Logger.step(`Activating group: ${groupName}`);

        const myGroupsPage = new MyGroupsPage(page);
        const paymentPage = new GroupActivationPaymentPage(page);

        const result = await myGroupsPage.openPriorityInactiveGroupAndRedirectToPayment(groupName);

        if (result.status === 'NOT_FOUND') {
            throw new Error(`Inactive group "${groupName}" not found for activation.`);
        }

        await paymentPage.waitForVisible();
        await paymentPage.fillPaymentDetails();
        await paymentPage.submitPayment();

        Logger.success(`Group activation flow completed for: ${groupName}`);
    }
}
