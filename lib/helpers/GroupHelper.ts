import { Page, expect } from '@playwright/test';
import { UI_CONSTANTS } from '../data/constants/ui-constants';
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

        const dashboard = new DashboardPage(page);
        const createGroup = new CreateGroupPage(page);

        await NavigationHelper.gotoDashboard(page);
        await dashboard.dismissSupportPopups();
        await dashboard.clickStartGroup();

        // Detect if we are blocked by a limit modal or redirected to pricing/plans
        const isBlockedByModal = await page.locator('.chakra-modal__content, section[role="dialog"]').first().isVisible({ timeout: 5000 }).catch(() => false);
        if (isBlockedByModal) {
            const modalText = await page.locator('.chakra-modal__content, section[role="dialog"]').first().innerText();
            if (modalText.toLowerCase().includes('limit')) {
                throw new Error(`Group Creation Blocked: User has reached their active group limit. Modal: "${modalText.split('\n')[0]}"`);
            }
        }

        // Wait for creation page with explicit error handling for pricing redirects
        try {
            await page.waitForURL(/\/groups\/create\/?/, { timeout: 15_000 });
        } catch (e) {
            const url = page.url();
            if (url.includes('/pricing') || url.includes('/plans')) {
                throw new Error(`Group Creation Failed: User redirected to pricing page (${url}). Likely missing an active plan.`);
            }
            throw e; 
        }

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

    /**
     * Asserts the active group limit modal is visible, verifies the plan text,
     * dismisses via OK, and confirms the modal is gone.
     * @param expectedPlanText - partial text to match the plan-specific limit message
     */
    static async verifyActiveGroupLimitModal(page: Page, expectedPlanText: string) {
        Logger.step('Verifying active group limit modal');

        const modal = page.locator('.chakra-modal__content, section[role="dialog"]').first();
        await expect(modal).toBeVisible({ timeout: 15_000 });

        // Heading assertion
        await expect(modal.getByText(/You've reached your active group limit/i)).toBeVisible();

        // Plan-specific body text assertion
        // NOTE: toContainText is more robust for multi-line Chakra paragraphs
        await expect(modal).toContainText(expectedPlanText, { timeout: 10_000 });

        // Dismiss modal - Try Cancel first (standard UX), if not found try OK
        const cancelBtn = modal.getByRole('button', { name: UI_CONSTANTS.GROUPS.LIMIT_MODAL.CANCEL_BUTTON });
        const okBtn = modal.getByRole('button', { name: UI_CONSTANTS.GROUPS.LIMIT_MODAL.OK_BUTTON });

        if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
        } else {
            await okBtn.click();
        }

        // Confirm closed
        await expect(modal).not.toBeVisible({ timeout: 5_000 });
        Logger.success('Active group limit modal verified and dismissed');
    }

    /**
     * Triggers the limit modal by clicking the "Create Your Support Group" button on the Dashboard.
     * This is the fastest way to verify plan-based enforcement for pre-seeded accounts.
     */
    static async triggerLimitViaCreateGroup(page: Page, expectedPlanText: string) {
        Logger.step('Triggering limit modal via Dashboard "Create Group" click');
        
        await NavigationHelper.gotoDashboard(page);
        const dashboard = new DashboardPage(page);
        await dashboard.clickStartGroup();
        
        await this.verifyActiveGroupLimitModal(page, expectedPlanText);
    }
}


