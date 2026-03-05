import { test } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { PaymentHelper } from '../../../lib/helpers/PaymentHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Leader Full Flow - Active Group ($19)
 * -------------------------------------
 * Validates the paid subscription journey for a Leader.
 */
test.describe.serial('Leader Flow - Active Group Subscription', { tag: ['@smoke', '@leader'] }, () => {
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

    test('Step 1: Registration - Create new leader account', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LAG-01' });
        await LeaderHelper.registerNewLeader(page, context, email);
    });

    test('Step 2: Welcome - Select leader role', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LAG-02' });
        await LeaderHelper.selectRoleAndContinue(page);
    });

    test('Step 3: Onboarding - Skip to Hosting Plan', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LAG-03' });
        await LeaderHelper.completeOnboardingViaSkip(page);
    });

    test('Step 4: Hosting Plan - Select Active plan ($19)', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LAG-04' });
        await PaymentHelper.selectActivePlanAndProceed(page);
    });

    test('Step 5: Payment - Complete Stripe checkout', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LAG-05' });
        await PaymentHelper.fillStripeAndPay(page);
    });

    test('Step 6: Payment Success - Verify redirect to Dashboard', async ({ }, testInfo) => {
        testInfo.annotations.push({ type: 'testId', description: 'TC-LAG-06' });
        await PaymentHelper.verifySuccessAndContinue(page);
        await AssertionHelper.verifyDashboardLoaded(page);
    });
});
