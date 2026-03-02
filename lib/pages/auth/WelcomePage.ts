import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ROUTES, ROUTE_PATHS } from '../../../config/urls';
import { Logger } from '../../utils/Logger';

/**
 * WelcomePage (Phase 2-A)
 * -----------------------
 * Handles the post-registration / post-login welcome screen
 * where users select their primary path (Leader or Member).
 */
export class WelcomePage extends BasePage {
    private readonly leaderPathButton: Locator;
    private readonly memberPathButton: Locator;
    private readonly welcomeHeading: Locator;

    // Static UI Labels (Page-Specific)
    private static readonly LABELS = {
        HEADING: 'Welcome!',
        LEADER_BUTTON: 'Continue as a Group Leader',
        MEMBER_BUTTON: 'Explore support groups',
        CONTINUE: 'Continue',
    };

    constructor(page: Page) {
        super(page);

        this.welcomeHeading = page.locator('p').filter({ hasText: /Welcome to/ }).first();

        // Use exact text matching - these are stable button labels
        this.leaderPathButton = page.getByRole('button', { name: 'Continue as a Group Leader' });
        this.memberPathButton = page.getByRole('button', { name: 'Explore support groups' });
    }

    // Getter for Continue button - resolved fresh each time since CSS class changes on enable/disable
    private getContinueButton(): Locator {
        return this.page.getByRole('button', { name: 'Continue' }).filter({ hasNotText: 'Leader' }).filter({ hasNotText: 'Explore' });
    }

    /**
     * Navigates to the Welcome Page route.
     */
    async goto() {
        Logger.step('Navigating to Welcome Page');
        await super.goto(ROUTES.welcome());
        Logger.success('Welcome Page loaded');
    }

    /**
     * Verifies the Welcome Page is currently displayed.
     */
    async verifyPageLoaded() {
        Logger.step('Verifying Welcome Page is displayed');
        await this.dismissSupportPopups();
        // Wait specifically for the two role buttons to confirm the page is interactive
        await this.leaderPathButton.waitFor({ state: 'visible', timeout: 20000 });
        await this.memberPathButton.waitFor({ state: 'visible', timeout: 5000 });

        const url = this.page.url();
        if (!url.includes(ROUTE_PATHS.WELCOME)) {
            Logger.warn(`Current URL ${url} does not include ${ROUTE_PATHS.WELCOME}, but role buttons are visible.`);
        }
        Logger.success('Welcome Page verification successful (Role buttons visible)');
    }

    /**
     * Clicks the "Continue" button on the Welcome screen.
     * Expects it to be enabled after role selection.
     */
    async clickContinue() {
        Logger.step('Clicking Welcome Continue button');
        await this.dismissSupportPopups();

        // The Continue button is inside css-1dnp1c1 container and must be enabled
        const continueBtn = this.getContinueButton();

        // Wait for it to exist and be enabled (Chakra UI enables it after role selection)
        await continueBtn.waitFor({ state: 'attached', timeout: 10000 });
        await expect(continueBtn).toBeEnabled({ timeout: 10000 });
        await continueBtn.click();
        Logger.success('Welcome Continue clicked');
    }

    /**
     * Selects the Group Leader path and verifies Continue becomes enabled.
     */
    async selectGroupLeader() {
        Logger.step(`Selecting path: ${WelcomePage.LABELS.LEADER_BUTTON}`);
        await this.dismissSupportPopups();

        // Click the leader button
        await this.leaderPathButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.leaderPathButton.click();
        Logger.info('Clicked Continue as a Group Leader');

        // Verify Continue enabled, retry with force if needed
        try {
            await expect(this.getContinueButton()).toBeEnabled({ timeout: 5000 });
        } catch (e) {
            Logger.warn('Continue not enabled, force-clicking leader button again...');
            await this.leaderPathButton.click({ force: true });
            await expect(this.getContinueButton()).toBeEnabled({ timeout: 5000 });
        }

        Logger.success('Group Leader path selected');
    }

    /**
     * Selects the Support Group member/explore path and verifies Continue becomes enabled.
     */
    async selectSupportGroupMember() {
        Logger.step(`Selecting path: ${WelcomePage.LABELS.MEMBER_BUTTON}`);
        await this.dismissSupportPopups();

        // Click the member button
        await this.memberPathButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.memberPathButton.click();
        Logger.info('Clicked Explore support groups');

        // Verify Continue enabled, retry with force if needed
        try {
            await expect(this.getContinueButton()).toBeEnabled({ timeout: 5000 });
        } catch (e) {
            Logger.warn('Continue not enabled, force-clicking member button again...');
            await this.memberPathButton.click({ force: true });
            await expect(this.getContinueButton()).toBeEnabled({ timeout: 5000 });
        }

        Logger.success('Explore Support Groups path selected');
    }

    /**
     * Legacy Alias
     */
    async selectExploreSupportGroups() {
        return this.selectSupportGroupMember();
    }
}
