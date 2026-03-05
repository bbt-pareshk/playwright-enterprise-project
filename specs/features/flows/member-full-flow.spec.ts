import { test } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { MemberHelper } from '../../../lib/helpers/MemberHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Member Full Flow - Explore Support Groups
 * -----------------------------------------
 * This spec validates the granular steps of the support member journey.
 * It uses the centralized MemberHelper and expands to 7 granular tests.
 */
test.describe.serial('Member Full Flow - Registration & Onboarding', { tag: ['@smoke', '@member'] }, () => {
    let context: any;
    let page: any;
    let email: string;

    test.beforeAll(async ({ browser }, testInfo) => {
        const use = testInfo.project.use;
        context = await browser.newContext({
            ...use,
            // Only recordVideo needs explicit mapping — Playwright auto-manages tracing in test hooks
            ...(use.video && use.video !== 'off'
                ? { recordVideo: { dir: testInfo.outputPath('videos') } }
                : {}),
        });
        page = await context.newPage();
        email = DataGenerator.email();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('Step 1: Registration - Submit form', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-MFF-01' });
        Logger.step('Step 1: Registration - Submit form');
        await MemberHelper.submitRegistrationForm(page, email);
    });

    test('Step 2: Registration - Verify OTP email', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-MFF-02' });
        Logger.step('Step 2: Registration - Verify OTP email');
        await MemberHelper.verifyEmailWithOTP(page, context, email);
    });

    test('Step 3: Welcome - Select member role', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-MFF-03' });
        Logger.step('Step 3: Welcome - Select member role');
        await MemberHelper.selectRoleAndContinue(page);
    });

    test('Step 4: Onboarding - Complete via Skip path', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-MFF-04' });
        Logger.step('Step 4: Onboarding - Complete via Skip path');
        await MemberHelper.completeOnboardingViaSkip(page);
    });

    test('Step 5: Dashboard - Verify URL after onboarding', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-MFF-05' });
        Logger.step('Step 5: Dashboard - Verify URL after onboarding');
        await AssertionHelper.verifyDashboardLoaded(page);
    });

    test('Step 6: Dashboard - Verify key UI elements', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-MFF-06' });
        Logger.step('Step 6: Dashboard - Verify key UI elements');
        await MemberHelper.verifyDashboard(page);
    });

    test('Step 7: Session - Confirm stability after reload', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-MFF-07' });
        Logger.step('Step 7: Session - Confirm stability after reload');
        // Final check: refresh and ensure still on dashboard
        await page.reload();
        await AssertionHelper.verifyDashboardLoaded(page);
        Logger.success('Member Full Flow (7 steps) completed successfully');
    });
});
