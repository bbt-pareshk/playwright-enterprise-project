import { test, expect } from '../../lib/fixtures/index';
import { DataGenerator } from '../../lib/utils/DataGenerator';
import { LeaderHelper } from '../../lib/helpers/LeaderHelper';
import { PaymentHelper } from '../../lib/helpers/PaymentHelper';
import { Logger } from '../../lib/utils/Logger';
import path from 'path';

/**
 * Functional Leader Setup
 * ------------------------
 * Provisions a fresh leader, completes registration and payment, 
 * then captures the state for Lifecycle tests.
 */
test.describe('Setup - Functional Leader Provisioning', { tag: ['@setup', '@provisioner'] }, () => {

    test('Provision Paid Leader with Available Slots', async ({ page, context }, testInfo) => {
        const statePath = path.resolve(process.cwd(), 'storage/auth/leader_functional.json');
        
        test.setTimeout(240_000);
        const email = DataGenerator.email();

        await LeaderHelper.registerNewLeader(page, context, email);
        await LeaderHelper.selectRoleAndContinue(page);
        await LeaderHelper.completeOnboardingViaSkip(page);
        await PaymentHelper.selectActivePlanAndProceed(page);
        await PaymentHelper.fillStripeAndPay(page);

        // Verification & State Capture
        await PaymentHelper.verifySuccessAndContinue(page);
        await expect(page).toHaveURL(/.*\/groups(\/create)?$/, { timeout: 15_000 });
        
        // Finalize state capture
        await context.storageState({ path: statePath });
        Logger.success('Functional Leader provisioned and state captured at Dashboard.');
    });
});

