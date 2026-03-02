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
     * Performs the full 4-tab group creation flow:
     *   Tab 1 → Group Details (Name, Cover Image, Description, Tags)
     *   Tab 2 → Professional Background (conditional — first-time only)
     *   Tab 3 → Pricing Model (conditional — selects "Free")
     *   Tab 4 → Review & Submit (Launch Group)
     */
    static async createGroup(page: Page, groupName: string) {
        Logger.step(`Creating group: ${groupName}`);

        await NavigationHelper.gotoDashboard(page);
        const dashboard = new DashboardPage(page);
        await dashboard.clickStartGroup();

        await page.waitForURL(/\/groups\/create\/?/, { timeout: 20_000 });

        const createGroup = new CreateGroupPage(page);
        await createGroup.verifyPageLoaded();

        // ── Tab 1: Group Details ─────────────────────────────────────────────
        await createGroup.enterGroupDetails(groupName, DataGenerator.description());
        await createGroup.uploadCoverImage(APP_CONSTANTS.DUMMY_PROFILE_IMAGE_PATH);
        await createGroup.selectTag();
        await createGroup.clickContinue();

        // ── Tab 2: Professional Background (conditional — first-time only) ───
        const isProfBgVisible = await createGroup.isProfessionalBackgroundVisible();
        if (isProfBgVisible) {
            Logger.info('Professional Background tab detected — completing required fields');
            await createGroup.fillProfessionalBackground();
            await createGroup.clickContinue();
        } else {
            Logger.info('Professional Background tab not present');
        }

        // ── Tab 3: Pricing Model (conditional) ───────────────────────────────
        const isPricingVisible = await createGroup.isPricingModelVisible();
        if (isPricingVisible) {
            Logger.info('Pricing Model tab detected — selecting "Free"');
            await createGroup.selectFreePricing();
            await createGroup.clickContinue();
        } else {
            Logger.info('Pricing Model tab not present');
        }

        // ── Tab 4: Review & Submit ───────────────────────────────────────────
        await createGroup.launchGroup();

        Logger.success(`Group creation flow completed for: ${groupName}`);
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
