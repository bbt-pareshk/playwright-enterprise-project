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
test.describe('Member Lifecycle Flows @smoke @member @e2e', () => {

    test.describe.serial('Scenario A: Full Journey via CONTINUE path', () => {
        let context: any;
        let page: any;
        let email: string;

        test.beforeAll(async ({ browser }) => {
            context = await browser.newContext();
            page = await context.newPage();
            email = DataGenerator.email();
        });

        test.afterAll(async () => {
            await context.close();
        });

        test('MEMBER-LC-A1: Fresh Registration Form Submission', async () => {
            await MemberHelper.submitRegistrationForm(page, email);
        });

        test('MEMBER-LC-A2: Email Verification via Mailinator (OTP)', async () => {
            await MemberHelper.verifyEmailWithOTP(page, context, email);
        });

        test('MEMBER-LC-A3: Welcome Screen - Role Selection', async () => {
            await MemberHelper.selectRoleAndContinue(page);
        });

        test('MEMBER-LC-A4: Onboarding (Continue) & Dashboard Verify', async () => {
            await MemberHelper.completeOnboardingViaContinue(page);
            await MemberHelper.verifyDashboard(page);
        });
    });

    test.describe.serial('Scenario B: Full Journey via SKIP path', () => {
        let context: any;
        let page: any;
        let email: string;

        test.beforeAll(async ({ browser }) => {
            context = await browser.newContext();
            page = await context.newPage();
            email = DataGenerator.email();
        });

        test.afterAll(async () => {
            await context.close();
        });

        test('MEMBER-LC-B1: Fresh Registration Form Submission', async () => {
            await MemberHelper.submitRegistrationForm(page, email);
        });

        test('MEMBER-LC-B2: Email Verification via Mailinator (OTP)', async () => {
            await MemberHelper.verifyEmailWithOTP(page, context, email);
        });

        test('MEMBER-LC-B3: Welcome Screen - Role Selection', async () => {
            await MemberHelper.selectRoleAndContinue(page);
        });

        test('MEMBER-LC-B4: Onboarding (Skip) & Dashboard Verify', async () => {
            await MemberHelper.completeOnboardingViaSkip(page);
            await MemberHelper.verifyDashboard(page);
        });
    });
});
