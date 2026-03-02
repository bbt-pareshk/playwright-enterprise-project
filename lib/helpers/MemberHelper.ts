import { Page, BrowserContext, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/auth/RegistrationPage';
import { WelcomePage } from '../pages/auth/WelcomePage';
import { OnboardingPage } from '../pages/auth/OnboardingPage';
import { MailinatorPage } from '../pages/utils/MailinatorPage';
import { AssertionHelper } from './AssertionHelper';
import { MESSAGES } from '../data/constants/messages';
import { Logger } from '../utils/Logger';

/**
 * MemberHelper
 * ------------
 * Orchestrates high-level business flows for the Support Member persona.
 * Centralizes duplicate logic from member-full-flow.spec.ts and member-lifecycle.spec.ts.
 */
export class MemberHelper {

    /**
     * Step 1: Submits the registration form and lands on the OTP page.
     */
    static async submitRegistrationForm(page: Page, email: string) {
        Logger.step(`Submitting member registration form for: ${email}`);
        const registrationPage = new RegistrationPage(page);
        await registrationPage.goto();
        await registrationPage.fillRegistrationForm({
            firstName: 'Auto',
            lastName: 'Member',
            email: email,
            password: 'Password123!'
        });
        await registrationPage.clickCreateAccount();
        await registrationPage.waitForOTPPage();
        Logger.success('Registration form submitted, OTP page reached');
    }

    /**
     * Step 2: Fetches OTP from Mailinator and verifies it on the OTP page.
     */
    static async verifyEmailWithOTP(page: Page, context: BrowserContext, email: string) {
        Logger.step(`Verifying email via Mailinator for: ${email}`);
        const registrationPage = new RegistrationPage(page);

        const mailinatorTab = await context.newPage();
        const mailinator = new MailinatorPage(mailinatorTab);
        const otp = await mailinator.getOTPFromEmail(email);
        await mailinatorTab.close();

        await page.bringToFront();
        await registrationPage.verifyEmailWithOTP(otp);
        await AssertionHelper.verifyToastMessage(page, new RegExp(MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED, 'i'));
        Logger.success('Email verification (OTP) successful');
        return otp;
    }

    /**
     * Performs a full registration flow by combining the granular steps.
     */
    static async registerNewMember(page: Page, context: BrowserContext, email: string) {
        await this.submitRegistrationForm(page, email);
        return await this.verifyEmailWithOTP(page, context, email);
    }

    /**
     * Selects 'Explore support groups' and continues past the Welcome screen.
     */
    static async selectRoleAndContinue(page: Page) {
        Logger.step('Selecting Member role on Welcome page');
        const welcomePage = new WelcomePage(page);
        await welcomePage.verifyPageLoaded();
        await welcomePage.selectSupportGroupMember();
        await welcomePage.clickContinue();
        Logger.success('Role selection completed');
    }

    /**
     * Completes member onboarding using the multi-step Continue path.
     */
    static async completeOnboardingViaContinue(page: Page) {
        Logger.step('Completing Member onboarding via CONTINUE path');
        const onboardingPage = new OnboardingPage(page);
        // Wait for first onboarding screen
        await expect(page.getByText(/What kind of support are you looking for/i)).toBeVisible({ timeout: 20000 });
        await onboardingPage.completeMemberOnboardingViaContinue();
        Logger.success('Member onboarding (Continue) completed');
    }

    /**
     * Completes member onboarding using the Skip path.
     */
    static async completeOnboardingViaSkip(page: Page) {
        Logger.step('Completing Member onboarding via SKIP path');
        const onboardingPage = new OnboardingPage(page);
        // Wait for first onboarding screen
        await expect(page.getByText(/What kind of support are you looking for/i)).toBeVisible({ timeout: 20000 });
        await onboardingPage.completeMemberOnboardingViaSkip();
        Logger.success('Member onboarding (Skip) completed');
    }

    /**
     * Verifies the member dashboard is loaded with key UI elements visible.
     */
    static async verifyDashboard(page: Page) {
        Logger.step('Verifying Member Dashboard content');
        await AssertionHelper.verifyDashboardLoaded(page);

        // Specific Member Dashboard element: "Find a support group" button or "Explore Groups"
        const exploreHeading = page.getByRole('heading', { name: /Support Groups/i }).or(page.getByText(/Explore Groups/i)).first();
        await expect(exploreHeading).toBeVisible({ timeout: 15000 });

        const findButton = page.getByRole('button', { name: /find a support group/i }).first();
        await expect(findButton).toBeVisible();

        Logger.success('Member dashboard verification successful');
    }
}
