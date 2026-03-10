import { test, expect } from '../../../lib/fixtures/index';
import { WelcomePage } from '../../../lib/pages/auth/WelcomePage';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { MemberHelper } from '../../../lib/helpers/MemberHelper';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { ROUTE_PATHS } from '../../../config/urls';
import { Logger } from '../../../lib/utils/Logger';
import { UI_CONSTANTS } from '../../../lib/data/constants/ui-constants';

/**
 * Role & Onboarding Domain Matrix
 * ------------------------------
 * This centralized spec validates all permutations of the Welcome role selection
 * and subsequent Onboarding journeys for both Leaders and Members.
 * 
 * DESIGN PRINCIPLES:
 * 1. High Test Count: Uses multiple atomic test() blocks.
 * 2. High Performance: Uses .serial with a shared registration to avoid duplicate setup.
 * 3. Atomic Reliability: Each test depends on the state established by the previous one.
 */


/**
 * Role & Onboarding Domain Matrix
 * ------------------------------
 * This spec validates all permutations of the Welcome role selection
 * and subsequent Onboarding journeys for both Leaders and Members.
 * 
 * PERFORMANCE OPTIMIZATION:
 * 1. High Parallelization: Removed .serial to enable maximum worker utilization.
 * 2. Atomic Independence: Each test performs its own localized setup.
 * 3. Granular Test Count: Split UI checks from routing logic for better visibility and faster debugging.
 */

test.describe('Domain Matrix: Leader Role & Onboarding', { tag: ['@smoke', '@onboarding', '@leader'] }, () => {

    test.beforeEach(async ({ page, context }) => {
        const email = DataGenerator.generateEmail();
        // Each test starts with a fresh user registration to ensure parity and parallel-safety
        await LeaderHelper.registerNewLeader(page, context, email);
    });

    test('L-WLC-01: Welcome Screen - Initial Architecture and URL', async ({ page }) => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.verifyPageLoaded();
        await expect(page).toHaveURL(new RegExp(ROUTE_PATHS.WELCOME));
        Logger.success('Welcome page URL verified');
    });

    test('L-WLC-02: Welcome Screen - Primary Button Visibility', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Continue as a Group Leader' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Explore support groups' })).toBeVisible();
        Logger.success('Role selection options visible');
    });

    test('L-WLC-03: Welcome Screen - Continue CTA State (Initial)', async ({ page }) => {
        // Continue button should be disabled initially
        const continueBtn = page.getByRole('button', { name: 'Continue', exact: true }).filter({ hasNotText: 'Leader' });
        await expect(continueBtn).toBeDisabled();
        Logger.success('Continue button disabled by default');
    });

    test('L-WLC-04: Welcome Screen - Role Selection Toggle (Leader Path)', async ({ page }) => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.selectGroupLeader();

        // Final state should be Leader
        const continueBtn = page.getByRole('button', { name: 'Continue', exact: true }).filter({ hasNotText: 'Leader' });
        await expect(continueBtn).toBeEnabled();
        Logger.success('Role toggle logic enabled Continue button for Leader path');
    });

    test('L-LOB-01: Leader Onboarding - Routing from Welcome Screen', async ({ page }) => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.selectGroupLeader();
        await welcomePage.clickContinue();
        await page.waitForURL(new RegExp(ROUTE_PATHS.ONBOARDING));
        Logger.success('Leader successfully routed to Onboarding');
    });

    test('L-LOB-02: Leader Onboarding - Content Integrity Check', async ({ page }) => {
        await LeaderHelper.selectRoleAndContinue(page);
        await expect(page.getByText(new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.LEADER_INTRO, 'i'))).toBeVisible();
        Logger.success('Leader Onboarding intro screen verified');
    });

    test('L-LOB-03: Leader Onboarding - Skip Navigation to Hosting Plan', async ({ page }) => {
        await LeaderHelper.selectRoleAndContinue(page);
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.clickSkip();
        // NOTE: Staging may route to /groups if app decides no hosting plan is needed.
        // We accept either destination as a valid skip outcome.
        await page.waitForURL(
            url => url.pathname.includes(ROUTE_PATHS.HOSTING_PLAN) || url.pathname.includes('/groups'),
            { timeout: 40000 }
        );
        Logger.success('Leader successfully skipped onboarding (accepted hosting-plan OR groups)');
    });
});

test.describe('Domain Matrix: Member Role & Onboarding', { tag: ['@smoke', '@onboarding', '@member'] }, () => {

    test.beforeEach(async ({ page, context }) => {
        const email = DataGenerator.generateEmail();
        // Each test starts with a fresh member registration
        await MemberHelper.registerNewMember(page, context, email);
    });

    test('M-WLC-01: Welcome Screen - Initial Member Landing State', async ({ page }) => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.verifyPageLoaded();
        await expect(page).toHaveURL(new RegExp(ROUTE_PATHS.WELCOME));
        Logger.success('Member landing on Welcome page verified');
    });

    test('M-WLC-02: Welcome Screen - Member Role Selection Logic', async ({ page }) => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.selectSupportGroupMember();

        const continueBtn = page.getByRole('button', { name: 'Continue', exact: true }).filter({ hasNotText: 'Explore' });
        await expect(continueBtn).toBeEnabled();
        Logger.success('Member path selection enabled Continue button');
    });

    test('M-LOB-01: Member Onboarding - Routing and Redirect', async ({ page }) => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.selectSupportGroupMember();
        await welcomePage.clickContinue();

        await page.waitForURL(new RegExp(ROUTE_PATHS.ONBOARDING));
        Logger.success('Member successfully routed to Onboarding');
    });

    test('M-LOB-02: Member Onboarding - Persona Specific Content', async ({ page }) => {
        await MemberHelper.selectRoleAndContinue(page);
        // Members have different intro text than Leaders
        await expect(page.getByText(new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.MEMBER_INTRO, 'i'))).toBeVisible();
        Logger.success('Member Onboarding intro screen verified');
    });

    test('M-LOB-03: Member Onboarding - Skip Redirect to Discovery', async ({ page }) => {
        await MemberHelper.selectRoleAndContinue(page);
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.clickSkip();

        // Members bypass Hosting Plan and go straight to /groups
        await page.waitForURL(/.*\/groups\/?$/);
        Logger.success('Member successfully skipped onboarding to Discovery page');
    });
});

