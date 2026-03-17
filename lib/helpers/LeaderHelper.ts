import { Page, BrowserContext, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/auth/RegistrationPage';
import { WelcomePage } from '../pages/auth/WelcomePage';
import { OnboardingPage } from '../pages/auth/OnboardingPage';
import { VerificationService } from '../utils/VerificationService';
import { AssertionHelper } from './AssertionHelper';
import { MESSAGES } from '../data/constants/messages';
import { APP_CONSTANTS } from '../data/constants/app-constants';
import { Logger } from '../utils/Logger';
import { ROUTE_PATHS } from '../../config/urls';
import { UI_CONSTANTS } from '../data/constants/ui-constants';

/**
 * LeaderHelper
 * ------------
 * Orchestrates high-level business flows for the Group Leader persona.
 * Centralizes duplicate logic from various Leader-related lifecycle specs.
 */
export class LeaderHelper {

    /**
     * Performs a full registration flow for a Leader including email verification.
     */
    static async registerNewLeader(page: Page, context: BrowserContext, email: string) {
        Logger.step(`Registering new leader with email: ${email}`);
        const registrationPage = new RegistrationPage(page);

        await registrationPage.goto();
        await registrationPage.fillRegistrationForm({
            firstName: 'Auto',
            lastName: 'Leader',
            email: email,
            password: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT
        });
        await registrationPage.clickCreateAccount();
        await registrationPage.waitForOTPPage();

        // OTP Fetch (Handles Bypass vs Real)
        const otp = await VerificationService.getOTP(page, email);

        // 4. Verification with Parallel Event Handling (Senior Pattern)
        await page.bringToFront();
        await registrationPage.enterOTP(otp);

        Logger.step('Submitting OTP and syncing Parallel UI Events');
        await Promise.all([
            registrationPage.clickVerifyEmail(),
            AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i')),
            page.waitForURL(url => url.pathname.includes(ROUTE_PATHS.WELCOME), { timeout: 30000 })
        ]);

        Logger.success('Leader registration and OTP verification completed');
    }

    /**
     * Selects 'Continue as a Group Leader' and continues past the Welcome screen.
     */
    static async selectRoleAndContinue(page: Page) {
        Logger.step('Selecting Leader role on Welcome page');
        const welcomePage = new WelcomePage(page);
        await welcomePage.verifyPageLoaded();
        await welcomePage.selectGroupLeader();
        await welcomePage.clickContinue();
        Logger.success('Leader role selection completed');
    }

    /**
     * Completes leader onboarding via the full multi-step sequence.
     */
    static async completeOnboardingViaContinue(page: Page) {
        Logger.step('Completing Leader onboarding via CONTINUE path');
        const onboardingPage = new OnboardingPage(page);
        // Wait for first onboarding screen
        await expect(page.getByText(new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.LEADER_INTRO, 'i'))).toBeVisible({ timeout: 15000 });
        await onboardingPage.completeLeaderOnboardingViaContinue();
        Logger.success('Leader onboarding (Continue) completed');
    }

    /**
     * Completes leader onboarding via the Skip path.
     */
    static async completeOnboardingViaSkip(page: Page) {
        Logger.step('Completing Leader onboarding via SKIP path');
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.completeLeaderOnboardingViaSkip();
        Logger.success('Leader onboarding (Skip) completed');
    }

    /**
     * Verifies the leader dashboard is loaded.
     */
    static async verifyDashboard(page: Page) {
        Logger.step('Verifying Leader Dashboard');
        await AssertionHelper.verifyDashboardLoaded(page);
        // Leader specific element check (now an actual button)
        const startGroupBtn = page.getByRole('button', { name: UI_CONSTANTS.DASHBOARD.START_GROUP_LINK }).first();
        await expect(startGroupBtn).toBeVisible({ timeout: 15000 });
        Logger.success('Leader dashboard verification successful');
    }
}
