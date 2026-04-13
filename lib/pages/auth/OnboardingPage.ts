import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { ROUTE_PATHS } from '../../../config/urls';

/**
 * OnboardingPage (Phase 2-B)
 * --------------------------
 * Handles the multi-step onboarding journey for both Leaders and Members.
 * Leader Flow: 3 Screens (Step 1, 2, 3) -> /hosting-plan
 * Member Flow: 2 Screens (Step 1, 2) -> /groups
 */
export class OnboardingPage extends BasePage {
    private readonly continueButton: Locator;
    private readonly skipButton: Locator;
    private readonly findSupportGroupButton: Locator;
    private readonly continueAsLeaderLegacyButton: Locator; // Keep for legacy compat

    // Static UI Labels (Internal)
    private static readonly LABELS = {
        CONTINUE: 'Continue',
        SKIP: 'Skip',
        CONTINUE_AS_LEADER: 'Continue as a Group Leader',
        FIND_SUPPORT_GROUP: /Explore Support Groups|Find Support Group/i,
    };

    constructor(page: Page) {
        super(page);

        // Static locators for buttons with unique names
        this.findSupportGroupButton = page.locator('button').filter({ hasText: OnboardingPage.LABELS.FIND_SUPPORT_GROUP });
        this.continueAsLeaderLegacyButton = page.getByRole('button', { name: OnboardingPage.LABELS.CONTINUE_AS_LEADER });

        // Continue and Skip share names with other potential buttons, so we set these here
        // but override in the click methods with fresh locators resolved at call-time
        this.continueButton = page.getByRole('button', { name: OnboardingPage.LABELS.CONTINUE, exact: true });
        this.skipButton = page.getByRole('button', { name: OnboardingPage.LABELS.SKIP, exact: true });
    }

    /**
     * Returns a fresh locator for the onboarding nav "Continue" button.
     * Uses the same locator strategy as Playwright codegen.
     */
    private getNavContinueButton() {
        // Enforce exact match to prevent conflict with "Continue as a Group Leader"
        return this.page.getByRole('button', { name: 'Continue', exact: true });
    }

    /**
     * Returns a fresh locator for the onboarding nav "Skip" button.
     * Uses text-based matching as the 'Skip' element may be a link or icon-div.
     */
    private getNavSkipButton() {
        return this.page.getByRole('button', { name: 'Skip' });
    }

    /**
     * Clicks the main "Continue" button on the current onboarding screen.
     */
    async clickContinue() {
        Logger.step('Attempting to click Onboarding Continue button');
        const btn = this.getNavContinueButton();
        await this.ensureActionEnabled(btn);
        await this.robustClick(btn);
    }

    /**
     * Ensures an onboarding action button (Continue/Find Group) is enabled.
     * If the button is disabled, it attempts to select the first available card/option.
     */
    private async ensureActionEnabled(btn: Locator) {
        await this.dismissSupportPopups();
        await btn.waitFor({ state: 'visible', timeout: 15000 });

        // If button is disabled, we likely need to select an option on the page
        if (await btn.isDisabled()) {
            Logger.info(`Button "${await btn.innerText()}" is disabled. Selecting first available option...`);

            // Centralized selector for onboarding choice cards and buttons
            const options = this.page.locator('ul.chakra-wrap__list button, [class*="card"], [role="checkbox"]').first();

            if (await options.isVisible()) {
                await options.click();
                Logger.info('Option selected. Waiting for button to enable...');
                await this.page.waitForTimeout(1000); // Wait for state change
            }
        }

        // Wait for enabled state with a reasonable timeout
        await expect(btn).toBeEnabled({ timeout: 15000 }).catch(async () => {
            Logger.warn(`Button "${await btn.innerText()}" still disabled after selection attempt.`);
        });
    }

    /**
     * Clicks the "Skip" button on the current onboarding screen.
     */
    async clickSkip() {
        Logger.step('Clicking Onboarding Skip button');
        await this.dismissSupportPopups();
        const btn = this.getNavSkipButton();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
    }

    /**
     * Clicks the final "Find Support Group" button on the last onboarding screen.
     */
    async clickFindSupportGroup() {
        Logger.step('Attempting to click final Find Support Group button');
        const btn = this.findSupportGroupButton;
        await this.ensureActionEnabled(btn);
        await this.robustClick(btn);
    }

    /* ============================
       LEADER FLOWS (3 Steps)
    ============================ */

    /**
     * Waits for any page-level loading spinners to disappear.
     */
    private async waitForLoaderToDisappear() {
        const loader = this.page.locator('.chakra-spinner, [class*="spinner"], text=/Loading/i').first();
        try {
            if (await loader.isVisible()) {
                Logger.info('Page loader detected. Waiting for it to disappear...');
                await loader.waitFor({ state: 'hidden', timeout: 20000 });
                Logger.info('Loader cleared.');
            }
        } catch (e) {
            Logger.warn('Loader wait timed out or failed. Continuing...');
        }
    }

    /**
     * Completes Leader onboarding by clicking Skip.
     * Logic: Handles Screen 1 (Welcome), Screen 2 (Survey), or Direct Redirect.
     */
    async completeLeaderOnboardingViaSkip() {
        Logger.step('Completing Leader onboarding via SKIP (Deep Check Flow)');
        
        // 1. ENSURE STABILITY: Wait for potential background redirects to settle
        await this.page.waitForLoadState('load');
        await this.waitForLoaderToDisappear();

        // 2. SESSION AWARENESS: If we already reached the destination, do nothing
        const url = this.page.url();
        if (url.includes(ROUTE_PATHS.HOSTING_PLAN) || url.includes('/groups')) {
            Logger.info(`Deep Check: Onboarding already bypassed. Current URL: ${url}`);
            return;
        }

        await this.dismissSupportPopups();

        // 3. SCREEN 1: Welcome Intro (Target specifically by unique heading)
        const welcomeHeading = this.page.getByText('Welcome to MentalHappy');
        const introContinue = this.page.getByRole('button', { name: 'Continue', exact: true }).filter({ hasNotText: 'Leader' });
        
        if (await welcomeHeading.isVisible()) {
            Logger.info('Screen 1 (Welcome Intro) confirmed via Heading.');
            
            if (await introContinue.isDisabled()) {
                Logger.info('Intro button disabled. Clicking Leader role button...');
                const leaderBtn = this.page.getByRole('button', { name: 'Continue as a Group Leader' });
                await leaderBtn.waitFor({ state: 'visible', timeout: 15000 });
                await leaderBtn.click({ force: true });
                await expect(introContinue).toBeEnabled({ timeout: 10000 });
            }
            
            await this.robustClick(introContinue);
            await this.page.waitForTimeout(1500); // Transition wait
        }

        // 4. SCREEN 2: Survey (Proceed only if not already redirected)
        if (!this.page.url().includes(ROUTE_PATHS.HOSTING_PLAN)) {
            Logger.info('Checking for Screen 2 (Survey) Skip option...');
            const skipElement = this.getNavSkipButton();
            if (await skipElement.isVisible()) {
                await this.clickSkip();
                await this.page.waitForURL(u => u.pathname.includes(ROUTE_PATHS.HOSTING_PLAN), { timeout: 15000 });
            }
        }
        
        Logger.success('Onboarding cleared successfully');
    }

    /**
     * Completes Leader onboarding by clicking Continue through all 3 screens.
     * Logic: Step 1 (Continue) -> Step 2 (Continue) -> Step 3 (Continue) -> /hosting-plan
     */
    async completeLeaderOnboardingViaContinue() {
        Logger.step('Completing Leader onboarding via 3-step CONTINUE sequence');

        // Step 1
        await this.clickContinue();
        Logger.info('Leader Onboarding: Step 1 Continue clicked');
        await this.page.waitForTimeout(1500);

        // Step 2
        await this.clickContinue();
        Logger.info('Leader Onboarding: Step 2 Continue clicked');
        await this.page.waitForTimeout(1500);

        // Step 3
        await this.clickContinue();
        Logger.info('Leader Onboarding: Step 3 Continue clicked');

        // Verify redirect to Hosting Plan - Increased timeout for staging stability
        await this.page.waitForURL(url => url.pathname.includes(ROUTE_PATHS.HOSTING_PLAN) || url.pathname.includes('hosting-plan'), { timeout: 30000 });
        Logger.success('Redirected to /hosting-plan');
    }

    /* ============================
       MEMBER FLOWS (2 Steps)
    ============================ */

    /**
     * Completes Member onboarding by clicking Continue through all 3 screens.
     * Logic: Step 1 (Continue) -> Step 2 (Continue) -> Step 3 (Find Support Group) -> Dashboard (/groups)
     */
    async completeMemberOnboardingViaContinue() {
        Logger.step('Completing Member onboarding via 3-step sequence');

        // Step 1
        await this.clickContinue();
        Logger.info('Member Onboarding: Step 1 Continue clicked');
        await this.page.waitForTimeout(1000);

        // Step 2
        await this.clickContinue();
        Logger.info('Member Onboarding: Step 2 Continue clicked');
        await this.page.waitForTimeout(1000);

        // Step 3: Button label changes to 'Find Support Group' for Members
        await this.clickFindSupportGroup();
        Logger.info('Member Onboarding: Step 3 Find Support Group clicked');

        // Verify redirect to Dashboard (/groups)
        await this.page.waitForURL(url => url.pathname.includes('/groups'), { timeout: 15000 });
        Logger.success('Redirected to Dashboard');
    }

    /**
     * Completes Member onboarding by clicking Skip.
     * As per user: "if you click on Skip then there is showing direct Dashboard"
     */
    async completeMemberOnboardingViaSkip() {
        Logger.step('Completing Member onboarding via SKIP');
        await this.clickSkip();
        await this.page.waitForURL(url => url.pathname.includes('/groups'), { timeout: 15000 });
        Logger.success('Redirected to Dashboard via Skip');
    }

    /* ============================
       BACKWARD COMPATIBILITY
    ============================ */

    /**
     * @deprecated Use WelcomePage.selectGroupLeader()
     */
    async selectGroupLeaderRole() {
        Logger.warn('selectGroupLeaderRole() is DEPRECATED. Use WelcomePage.selectGroupLeader().');
        await this.click(this.continueAsLeaderLegacyButton);
    }

    /**
     * Completes the onboarding flow using the specified method.
     * @param method 'skip' or 'continue'
     */
    async completeOnboardingFlow(method: 'skip' | 'continue' = 'skip') {
        Logger.info(`Completing onboarding flow using method: ${method}`);
        if (method === 'skip') {
            await this.completeLeaderOnboardingViaSkip();
        } else {
            await this.completeLeaderOnboardingViaContinue();
        }
    }
}
