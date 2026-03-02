import { Page } from '@playwright/test';
import { HostingPlanPage } from '../pages/hosting/HostingPlanPage';
import { FreeGroupPopup } from '../pages/hosting/FreeGroupPopup';
import { Logger } from '../utils/Logger';

/**
 * HostingHelper
 * -------------
 * Orchestrates the hosting plan selection flow.
 * Connects HostingPlanPage logic with confirmation popups.
 */
export class HostingHelper {
    /**
     * Completes the hosting selection using the Free plan path.
     * Flow: Selection -> Confirmation Popup -> Success
     */
    static async selectFreeHostingPlan(page: Page) {
        Logger.info('[HELPER] Starting Free Hosting selection flow');
        const hostingPage = new HostingPlanPage(page);
        const freePopup = new FreeGroupPopup(page);

        // 1. Ensure we are on the correct page
        await hostingPage.verifyPageLoaded();

        // 2. Select Free Plan
        await hostingPage.selectFreePlan();

        // 3. Handle Confirmation Popup
        await freePopup.verifyVisible();
        await freePopup.clickGoToGroup();

        Logger.success('[HELPER] Free Hosting selection completed');
    }

    /**
     * Initiates a paid hosting plan flow.
     * Flow: Selection -> Redirects to Payment (Stripe)
     * @param type - 'active' or 'multi'
     */
    static async selectPaidHostingPlan(page: Page, type: 'active' | 'multi') {
        Logger.info(`[HELPER] Starting ${type} Hosting selection flow`);
        const hostingPage = new HostingPlanPage(page);

        await hostingPage.verifyPageLoaded();

        if (type === 'active') {
            await hostingPage.selectActivePlan();
        } else {
            await hostingPage.selectMultiGroupPlan();
        }

        // Paid plans usually require clicking "Pay Now" after selection
        await hostingPage.clickPayNow();
        Logger.success(`[HELPER] ${type} Hosting path initiated (awaiting Stripe)`);
    }

    /**
     * Bypasses hosting selection using "Do this Later"
     */
    static async bypassHostingSelection(page: Page) {
        Logger.info('[HELPER] Bypassing hosting selection');
        const hostingPage = new HostingPlanPage(page);
        await hostingPage.verifyPageLoaded();
        await hostingPage.clickDoThisLater();
        Logger.success('[HELPER] Step bypassed');
    }
}
