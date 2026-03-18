import { test, expect } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { PaymentHelper } from '../../../lib/helpers/PaymentHelper';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Leader Full Flow - Active Group ($19)
 * -------------------------------------
 * Validates the paid subscription journey for a Leader.
 */
test.describe('Leader Flow - Active Group Subscription', { tag: ['@smoke', '@leader'] }, () => {

    test('Leader Active Group Subscription Journey', async ({ page, context }, testInfo) => {
        // Expand timeout since this single test runs the entire E2E journey
        test.setTimeout(180_000);
        const email = DataGenerator.email();

        await test.step('TC-LAG-01: Registration - Create new leader account', async () => {
            await LeaderHelper.registerNewLeader(page, context, email);
        });

        await test.step('TC-LAG-02: Welcome - Select leader role', async () => {
            await LeaderHelper.selectRoleAndContinue(page);
        });

        await test.step('TC-LAG-03: Onboarding - Skip to Hosting Plan', async () => {
            await LeaderHelper.completeOnboardingViaSkip(page);
        });

        await test.step('TC-LAG-04: Hosting Plan - Select Active plan ($19)', async () => {
            await PaymentHelper.selectActivePlanAndProceed(page);
        });

        await test.step('TC-LAG-05: Payment - Complete Stripe checkout', async () => {
            await PaymentHelper.fillStripeAndPay(page);
        });

        await test.step('TC-LAG-06: Payment Success - Verify redirect to Group Creation', async () => {
            // Post-payment, the app now redirects directly to /groups/create (no popup).
            // verifySuccessAndContinue() handles both the popup path and the direct redirect.
            await PaymentHelper.verifySuccessAndContinue(page);
            // Confirm we are on the group creation or groups section
            await expect(page).toHaveURL(/.*\/groups(\/create)?$/, { timeout: 15_000 });
            Logger.success('Leader Active Group Subscription Journey completed successfully');
        });
    });
});

