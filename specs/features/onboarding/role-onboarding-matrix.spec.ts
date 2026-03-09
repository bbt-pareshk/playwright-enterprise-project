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

test.describe.serial('Domain Matrix: Leader Role & Onboarding Journey', { tag: ['@smoke', '@onboarding', '@leader'] }, () => {
    let email: string;
    let page: any;
    let context: any;

    test.beforeAll(async ({ browser }, testInfo) => {
        email = DataGenerator.generateEmail();
        context = await browser.newContext();
        page = await context.newPage();

        // Single registration for the entire Leader chain
        await LeaderHelper.registerNewLeader(page, context, email);
    });

    test.afterAll(async () => {
        if (context) await context.close();
    });

    test('TC-WLC-01: Welcome Screen - Initial URL and Page State', async () => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.verifyPageLoaded();
        await expect(page).toHaveURL(new RegExp(ROUTE_PATHS.WELCOME));
        Logger.success('Welcome page URL verified');
    });

    test('TC-WLC-02: Welcome Screen - Role Selection Visibility', async () => {
        await expect(page.getByRole('button', { name: 'Continue as a Group Leader' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Explore support groups' })).toBeVisible();
        Logger.success('Role selection options visible');
    });

    test('TC-WLC-03: Welcome Screen - Role Selection Toggle Logic', async () => {
        const welcomePage = new WelcomePage(page);

        // Toggle Between Roles
        await welcomePage.selectSupportGroupMember();
        await welcomePage.selectGroupLeader();

        // Final state should be Leader for this matrix
        const continueBtn = page.getByRole('button', { name: 'Continue', exact: true }).filter({ hasNotText: 'Leader' });
        await expect(continueBtn).toBeEnabled();
        Logger.success('Role toggle logic verified - Leader selected');
    });

    test('TC-LOB-01: Leader Onboarding - Routing from Welcome Screen', async () => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.clickContinue();
        await page.waitForURL(new RegExp(ROUTE_PATHS.ONBOARDING));
        Logger.success('Leader successfully routed to Onboarding');
    });

    test('TC-LOB-02: Leader Onboarding - Verify Intro Screen Content', async () => {
        await expect(page.getByText(new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.LEADER_INTRO, 'i'))).toBeVisible();
        Logger.success('Leader Onboarding intro screen verified');
    });

    test('TC-LOB-03: Leader Onboarding - Skip Logic to Hosting Plan', async () => {
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.clickSkip();
        await page.waitForURL(new RegExp(ROUTE_PATHS.HOSTING_PLAN));
        Logger.success('Leader successfully skipped onboarding to Hosting Plan');
    });
});

test.describe.serial('Domain Matrix: Member Role & Onboarding Journey', { tag: ['@smoke', '@onboarding', '@member'] }, () => {
    let email: string;
    let page: any;
    let context: any;

    test.beforeAll(async ({ browser }) => {
        email = DataGenerator.generateEmail();
        context = await browser.newContext();
        page = await context.newPage();

        // Single registration for the entire Member chain
        await MemberHelper.registerNewMember(page, context, email);
    });

    test.afterAll(async () => {
        if (context) await context.close();
    });

    test('TC-WLC-04: Welcome Screen - Member Selection and Continue', async () => {
        const welcomePage = new WelcomePage(page);
        await welcomePage.verifyPageLoaded();
        await welcomePage.selectSupportGroupMember();
        await welcomePage.clickContinue();

        await page.waitForURL(new RegExp(ROUTE_PATHS.ONBOARDING));
        Logger.success('Member successfully selected role and continued');
    });

    test('TC-MOB-01: Member Onboarding - Verify Initial Screen', async () => {
        // Members have a different intro screen text than Leaders
        await expect(page.getByText(new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.MEMBER_INTRO, 'i'))).toBeVisible();
        Logger.success('Member Onboarding intro screen verified');
    });

    test('TC-MOB-02: Member Onboarding - Skip to Dashboard', async () => {
        const onboardingPage = new OnboardingPage(page);
        await onboardingPage.clickSkip();

        // Members bypass Hosting Plan and go straight to /groups
        await page.waitForURL(/.*\/groups\/?$/);
        Logger.success('Member successfully skipped onboarding to Dashboard');
    });
});
