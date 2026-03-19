import { Page, expect } from '@playwright/test';
import { GroupHelper } from '../helpers/GroupHelper';
import { NavigationHelper } from '../helpers/NavigationHelper';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { CreateGroupPage } from '../pages/group/CreateGroupPage';
import { DataGenerator } from '../utils/DataGenerator';
import { APP_CONSTANTS } from '../data/constants/app-constants';
import { Logger } from '../utils/Logger';

/**
 * GroupFlow
 * ---------
 * Atomic orchestration for the Group Creation Lifecycle.
 */
export class GroupFlow {

    /**
     * Initializes group creation from Dashboard.
     */
    static async startGroupCreation(page: Page) {
        Logger.step('Initializing Group Creation from Dashboard');
        const dashboard = new DashboardPage(page);
        const createGroup = new CreateGroupPage(page);

        await NavigationHelper.gotoDashboard(page);
        await dashboard.dismissSupportPopups();
        await dashboard.clickStartGroup();

        await createGroup.verifyPageLoaded();
        Logger.success('Group Creation page loaded');
    }

    /**
     * Tab 1: Basic Details (Mandatory)
     */
    static async fillTab1_BasicDetails(page: Page, groupName: string) {
        Logger.step(`Tab 1: Filling Basic Details for group: ${groupName}`);
        const createGroup = new CreateGroupPage(page);

        await createGroup.enterGroupDetails(groupName, DataGenerator.description());
        await createGroup.uploadCoverImage(APP_CONSTANTS.DUMMY_PROFILE_IMAGE_PATH);
        await createGroup.selectTag();
        
        await createGroup.clickContinue();
        Logger.success('Tab 1 (Basic Details) completed');
    }

    /**
     * Tab 2: Professional Background (Optional)
     */
    static async handleTab2_BioOptional(page: Page) {
        Logger.step('Tab 2: Checking for Optional Professional Background');
        const createGroup = new CreateGroupPage(page);
        
        const isProfBgVisible = await createGroup.isProfessionalBackgroundVisible();
        if (isProfBgVisible) {
            Logger.info('Optional Tab: Professional Background detected - Filling fields');
            await createGroup.fillProfessionalBackground();
            await createGroup.clickContinue();
            Logger.success('Tab 2 (Bio) completed');
        } else {
            Logger.info('Optional Tab: Professional Background not presented - Skipping');
        }
    }

    /**
     * Tab 3: Pricing Model (Mandatory)
     */
    static async fillTab3_PricingMandatory(page: Page) {
        Logger.step('Tab 3: Setting Group Pricing (Mandatory)');
        const createGroup = new CreateGroupPage(page);
        
        // Wait for Pricing tab to ensure we are synced
        const isPricingVisible = await createGroup.isPricingModelVisible();
        if (!isPricingVisible) {
            Logger.warn('Pricing model tab not immediately visible; trying wait...');
        }
        
        await createGroup.selectFreePricing();
        await createGroup.clickContinue();
        Logger.success('Tab 3 (Pricing) completed');
    }

    /**
     * Tab 4: Review & Submit (Mandatory)
     */
    static async submitTab4_LaunchGroup(page: Page) {
        Logger.step('Tab 4: Finalizing Group Creation (Launch)');
        const createGroup = new CreateGroupPage(page);
        
        await createGroup.launchGroup();
        
        // Final Assertion: Verify we are redirected to Group Details/Listing
        Logger.assertion('Verifying redirect to Group Details');
        await expect(page).toHaveURL(/.*\/groups\/[a-zA-Z0-9]+(\/details)?$/, { timeout: 30_000 });
        
        Logger.success('Group Lifecycle: Launch successful, redirected to details');
    }
}
