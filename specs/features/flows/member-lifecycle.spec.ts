import { test } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { MemberHelper } from '../../../lib/helpers/MemberHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Member Lifecycle Flows
 * --------------------
 * High-value E2E tests for the Support Member persona.
 * This version uses the centralized MemberHelper and expands to 8 granular tests.
 * 
 * Scenario A & B are split into 4 granular steps each for maximum visibility.
 */
test.describe('Member Lifecycle Flows', { tag: ['@smoke', '@member'] }, () => {

    test.describe.serial('Scenario A: Full Journey via CONTINUE path', () => {
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
            testInfo.annotations.push({ type: 'testId', description: 'MEMBER-LC-A1' });
            await MemberHelper.submitRegistrationForm(page, email);
        });

        test('Step 2: Registration - Verify OTP email', async ({ }, testInfo) => {
            testInfo.annotations.push({ type: 'testId', description: 'MEMBER-LC-A2' });
            await MemberHelper.verifyEmailWithOTP(page, context, email);
        });

        test('Step 3: Welcome - Select member role', async ({ }, testInfo) => {
            testInfo.annotations.push({ type: 'testId', description: 'MEMBER-LC-A3' });
            await MemberHelper.selectRoleAndContinue(page);
        });

        test('Step 4: Onboarding - Complete via CONTINUE path and verify Dashboard', async ({ }, testInfo) => {
            testInfo.annotations.push({ type: 'testId', description: 'MEMBER-LC-A4' });
            await MemberHelper.completeOnboardingViaContinue(page);
            await MemberHelper.verifyDashboard(page);
        });
    });

    test.describe.serial('Scenario B: Full Journey via SKIP path', () => {
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
            testInfo.annotations.push({ type: 'testId', description: 'MEMBER-LC-B1' });
            await MemberHelper.submitRegistrationForm(page, email);
        });

        test('Step 2: Registration - Verify OTP email', async ({ }, testInfo) => {
            testInfo.annotations.push({ type: 'testId', description: 'MEMBER-LC-B2' });
            await MemberHelper.verifyEmailWithOTP(page, context, email);
        });

        test('Step 3: Welcome - Select member role', async ({ }, testInfo) => {
            testInfo.annotations.push({ type: 'testId', description: 'MEMBER-LC-B3' });
            await MemberHelper.selectRoleAndContinue(page);
        });

        test('Step 4: Onboarding - Complete via SKIP path and verify Dashboard', async ({ }, testInfo) => {
            testInfo.annotations.push({ type: 'testId', description: 'MEMBER-LC-B4' });
            await MemberHelper.completeOnboardingViaSkip(page);
            await MemberHelper.verifyDashboard(page);
        });
    });
});
