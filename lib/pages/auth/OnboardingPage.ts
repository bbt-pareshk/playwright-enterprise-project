import { Page, Locator } from '@playwright/test';
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
        FIND_SUPPORT_GROUP: 'Find Support Group',
    };

    constructor(page: Page) {
        super(page);

        // Static locators for buttons with unique names
        this.findSupportGroupButton = page.getByRole('button', { name: OnboardingPage.LABELS.FIND_SUPPORT_GROUP });
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
        // Codegen uses: page.getByRole('button', { name: 'Continue' })
        // The icon inside the button does NOT affect accessible name
        return this.page.getByRole('button', { name: 'Continue' });
    }

    /**
     * Returns a fresh locator for the onboarding nav "Skip" button.
     */
    private getNavSkipButton() {
        return this.page.getByRole('button', { name: 'Skip' });
    }

    /**
     * Clicks the main "Continue" button on the current onboarding screen.
     */
    async clickContinue() {
        Logger.step('Clicking Onboarding Continue button');
        await this.dismissSupportPopups();
        const btn = this.getNavContinueButton();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
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
        Logger.step('Clicking final Find Support Group button');
        await this.dismissSupportPopups();
        await this.findSupportGroupButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.findSupportGroupButton.click();
    }

    /* ============================
       LEADER FLOWS (3 Steps)
    ============================ */

    /**
     * Completes Leader onboarding by clicking Skip on the first screen.
     * As per user: "if you click on Skip then there is showing direct Hosting plan"
     */
    async completeLeaderOnboardingViaSkip() {
        Logger.step('Completing Leader onboarding via SKIP');
        await this.clickSkip();
        await this.page.waitForURL(url => url.pathname.includes(ROUTE_PATHS.HOSTING_PLAN) || url.pathname.includes('hosting-plan'), { timeout: 15000 });
        Logger.success('Redirected to /hosting-plan via Skip');
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
        await this.page.waitForTimeout(1000);

        // Step 2
        await this.clickContinue();
        Logger.info('Leader Onboarding: Step 2 Continue clicked');
        await this.page.waitForTimeout(1000);

        // Step 3
        await this.clickContinue();
        Logger.info('Leader Onboarding: Step 3 Continue clicked');

        // Verify redirect to Hosting Plan
        await this.page.waitForURL(url => url.pathname.includes(ROUTE_PATHS.HOSTING_PLAN) || url.pathname.includes('hosting-plan'), { timeout: 15000 });
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
