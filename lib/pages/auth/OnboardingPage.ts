import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { MESSAGES } from '../../data/constants/messages';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

/**
 * OnboardingPage
 * ----------------
 * Handles the post-registration onboarding flow
 * including role selection and profile setup steps.
 */
export class OnboardingPage extends BasePage {
    private readonly continueAsLeaderButton: Locator;
    private readonly continueButton: Locator;
    private readonly skipButton: Locator;

    constructor(page: Page) {
        super(page);

        // Role selection
        this.continueAsLeaderButton = page.getByRole('button', { name: new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.CONTINUE_AS_LEADER, 'i') });

        // Navigation buttons
        this.continueButton = page.getByRole('button', { name: new RegExp(`^${UI_CONSTANTS.AUTH.ONBOARDING.CONTINUE}$`, 'i') });
        this.skipButton = page.getByRole('button', { name: new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.SKIP, 'i') });
    }

    /**
     * Selects "Continue as a Group Leader" role
     */
    async selectGroupLeaderRole(): Promise<void> {
        Logger.step('Selecting Group Leader role');
        await this.continueAsLeaderButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.click(this.continueAsLeaderButton);
        Logger.success('Group Leader role selected');
    }

    /**
     * Clicks the Continue button
     */
    async clickContinue(): Promise<void> {
        Logger.step('Clicking Continue button');
        await this.continueButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.click(this.continueButton);
    }

    /**
     * Clicks the Skip button
     */
    async clickSkip(): Promise<void> {
        Logger.step('Clicking Skip button');
        await this.skipButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.click(this.skipButton);
    }

    /**
     * Completes the entire onboarding flow by skipping all steps
     */
    async completeOnboardingFlow(): Promise<void> {
        Logger.step('Starting onboarding flow');

        // Step 1: Select Group Leader role
        await this.selectGroupLeaderRole();

        // Step 2: Click Continue
        await this.clickContinue();

        // Step 3: Skip first onboarding step
        await this.clickSkip();

        // Step 4: Skip second onboarding step
        await this.clickSkip();

        // Step 5: Skip third onboarding step
        await this.clickSkip();

        Logger.success('Onboarding flow completed');
    }
}
