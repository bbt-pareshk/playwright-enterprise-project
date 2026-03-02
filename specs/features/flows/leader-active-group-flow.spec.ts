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
test.describe.serial('Leader Full Flow - Active Group ($19) @smoke @critical @leader @e2e', () => {
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

    test('TC-LAG-01: Register new Leader & Verify Email', async () => {
        await LeaderHelper.registerNewLeader(page, context, email);
    });

    test('TC-LAG-02: Welcome page -> Role Selection', async () => {
        await LeaderHelper.selectRoleAndContinue(page);
    });

    test('TC-LAG-03: Onboarding -> Skip Path to Pricing', async () => {
        await LeaderHelper.completeOnboardingViaSkip(page);
    });

    test('TC-LAG-04: Hosting Plan -> Select Active Plan', async () => {
        await PaymentHelper.selectActivePlanAndProceed(page);
    });

    test('TC-LAG-05: Stripe Payment -> Full Checkout', async () => {
        await PaymentHelper.fillStripeAndPay(page);
    });

    test('TC-LAG-06: Payment Success -> Redirect to Dashboard', async () => {
        await PaymentHelper.verifySuccessAndContinue(page);
        await AssertionHelper.verifyDashboardLoaded(page);
    });
});
