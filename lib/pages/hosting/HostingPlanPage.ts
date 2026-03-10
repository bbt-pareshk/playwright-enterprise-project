import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { ROUTES, ROUTE_PATHS } from '../../../config/urls';

/**
 * HostingPlanPage (Phase 2-C)
 * --------------------------
 * Handles selection of group hosting plans (Free, Active, Multi-Group).
 * Includes selection CTAs and post-selection navigation buttons.
 */
export class HostingPlanPage extends BasePage {
    // --------- Plan CTAs ----------
    public readonly freePlanButton: Locator;
    public readonly activePlanButton: Locator;
    public readonly multiGroupPlanButton: Locator;

    // --------- Bottom Actions ----------
    private readonly payNowButton: Locator;
    private readonly doThisLaterButton: Locator;

    // Internal UI Labels (Static)
    // ⚠️ FREE_CTA verified from DOM capture (2026-02-24): DOM shows 'Get Group Listing' — not 'Go to Group'
    private static readonly LABELS = {
        PAGE_HEADING: 'Pick your way to Support',
        FREE_CTA: 'Get Group Listing',
        ACTIVE_CTA: 'Get Active Group',
        MULTI_CTA: 'Get Multi-Group',
        PAY_NOW: 'Pay Now',
        DO_THIS_LATER: 'Do this Later',
    };

    constructor(page: Page) {
        super(page);

        // Core CTAs (removed exact: true to be resilient to icons/arrows)
        this.freePlanButton = page.getByRole('button', { name: HostingPlanPage.LABELS.FREE_CTA });
        this.activePlanButton = page.getByRole('button', { name: HostingPlanPage.LABELS.ACTIVE_CTA });
        this.multiGroupPlanButton = page.getByRole('button', { name: HostingPlanPage.LABELS.MULTI_CTA });

        // Action buttons
        this.payNowButton = page.getByRole('button', { name: HostingPlanPage.LABELS.PAY_NOW, exact: true });
        this.doThisLaterButton = page.getByRole('button', { name: HostingPlanPage.LABELS.DO_THIS_LATER, exact: true });
    }

    /**
     * Navigates directly to the Hosting Plan page.
     */
    async goto() {
        Logger.step('Navigating to Hosting Plan Page');
        await super.goto(ROUTES.hostingPlan());
        // Wait for potential initial load spinner to clear
        await this.page.locator('.chakra-spinner').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => Logger.info('No initial spinner detected or already cleared'));
        Logger.success('Hosting Plan Page loaded');
    }

    /**
     * Verifies that the Hosting Plan page is visible and loaded.
     */
    async verifyPageLoaded() {
        Logger.step('Verifying Hosting Plan page content');
        await this.page.waitForURL(url => url.pathname.includes(ROUTE_PATHS.HOSTING_PLAN));

        // Staging can be slow; wait for the spinner to disappear
        await this.page.locator('.chakra-spinner').waitFor({ state: 'hidden', timeout: 30_000 });

        // Verify one of the key plans is visible
        await this.expectVisible(this.freePlanButton, 'Free Plan card should be visible', 15_000);
        Logger.success('Hosting Plan page verification successful');
    }

    /**
     * Selects the Free Group plan.
     */
    async selectFreePlan() {
        Logger.step('Selecting Free Group Plan');
        await this.click(this.freePlanButton);
    }

    /**
     * Selects the Active Group plan.
     */
    async selectActivePlan() {
        Logger.step('Selecting Active Group Plan');
        await this.click(this.activePlanButton);
    }

    /**
     * Selects the Multi-Group plan.
     */
    async selectMultiGroupPlan() {
        Logger.step('Selecting Multi-Group Plan');
        await this.click(this.multiGroupPlanButton);
    }

    /**
     * Clicks the "Pay Now" button (usually shown after selecting a paid plan).
     */
    async clickPayNow() {
        Logger.step('Clicking Pay Now');
        await this.click(this.payNowButton);
    }

    /**
     * Clicks "Do this Later" to bypass paid plan selection for now.
     */
    async clickDoThisLater() {
        Logger.step('Clicking Do this Later');
        await this.click(this.doThisLaterButton);
    }

    /**
     * High-level: Completes the hosting step using the Free plan.
     */
    async completeStepWithFreePlan() {
        Logger.step('Completing hosting step with Free Plan');
        await this.selectFreePlan();
        // Free plan often redirects directly or requires one more confirmation
        Logger.success('Free plan action triggered');
    }
}
