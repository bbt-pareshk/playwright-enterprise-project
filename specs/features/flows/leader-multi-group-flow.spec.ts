import { test } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { PaymentHelper } from '../../../lib/helpers/PaymentHelper';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Leader Journey: Multi-Group Plan ($49)
 * --------------------------------------
 * Validates the complete end-to-end journey for a Leader on the Multi-Group plan.
 *
 * DESIGN PRINCIPLES:
 * 1. Journey Architecture: Single test() block using test.step() for better traces.
 * 2. Robustness: Uses centralized Helpers (Leader, Payment) for reliability.
 */
test.describe('Leader Journey - Multi-Group Subscription', { tag: ['@smoke', '@leader'] }, () => {

    test('Leader Multi-Group Subscription Journey', async ({ page, context }) => {
        // Expand timeout since this single test runs the entire E2E journey
        test.setTimeout(180_000);
        const email = DataGenerator.email();

        await test.step('LEADER-MULTI-01: Registration - Fresh account creation', async () => {
            await LeaderHelper.registerNewLeader(page, context, email);
        });

        await test.step('LEADER-MULTI-02: Welcome - Role Selection (Leader)', async () => {
            await LeaderHelper.selectRoleAndContinue(page);
        });

        await test.step('LEADER-MULTI-03: Onboarding - Skip to Hosting Plan', async () => {
            await LeaderHelper.completeOnboardingViaSkip(page);
        });

        await test.step('LEADER-MULTI-04: Hosting Plan - Select Multi-Group plan ($49)', async () => {
            await PaymentHelper.selectMultiGroupPlanAndProceed(page);
        });

        await test.step('LEADER-MULTI-05: Payment - Complete Stripe checkout', async () => {
            await PaymentHelper.fillStripeAndPay(page);
        });

        await test.step('LEADER-MULTI-06: Payment Success - Verify redirect to Dashboard', async () => {
            await PaymentHelper.verifySuccessAndContinue(page);
            Logger.success('Leader Multi-Group Journey completed successfully');
        });
    });
});

