import { test, expect } from '../../../lib/fixtures/index';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { LeaderHelper } from '../../../lib/helpers/LeaderHelper';
import { PaymentHelper } from '../../../lib/helpers/PaymentHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Stripe Payment Validation - Edge Cases
 * -------------------------------------
 * This spec verifies that Stripe handles invalid payment scenarios correctly.
 * 
 * Optimized Flow:
 * 1. Registers a new Leader ONCE (beforeAll).
 * 2. Navigates to the Hosting Plan page.
 * 3. Runs multiple edge cases (Declined, Expired, etc.) sequentially.
 */
test.describe.serial('Stripe Payment Validation', { tag: ['@regression', '@leader'] }, () => {
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

        Logger.step('Prerequisite: Setting up new Leader for payment testing');

        // 1. Register & Verify OTP
        await LeaderHelper.registerNewLeader(page, context, email);

        // 2. Select Leader Role
        await LeaderHelper.selectRoleAndContinue(page);

        // 3. Complete Onboarding (Skip path for speed)
        await LeaderHelper.completeOnboardingViaSkip(page);

        // 4. Land on Hosting Plan Page
        await PaymentHelper.selectActivePlanAndProceed(page);
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('Declined Card - Verify error feedback', async () => {
        Logger.step('Testing Declined Card scenario');

        await PaymentHelper.fillStripeAndPay(page, {
            cardNumber: APP_CONSTANTS.TEST_DATA.PAYMENT.CARD_DECLINED
        });

        // 5. Assertion: Verify error message is displayed
        // Stripe displays errors inside their iframe
        const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
        await expect(stripeFrame.locator('body').or(page.locator('body')))
            .toContainText(/declined|error|could not process/i, { timeout: 15000 });

        Logger.success('Declined Card error verified correctly');
    });

    test('Expired Card - Verify expiry validation feedback', async () => {
        Logger.step('Testing Expired Card scenario');

        // Note: We don't need to refresh the page, just refill the Stripe form
        // Some fields might need to be cleared if Stripe doesn't auto-clear on error
        await PaymentHelper.fillStripeAndPay(page, {
            cardNumber: APP_CONSTANTS.TEST_DATA.PAYMENT.CARD_NUMBER,
            expiry: '01/20' // Hardcoded expired date
        });

        const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
        await expect(stripeFrame.locator('body').or(page.locator('body')))
            .toContainText(/expired|error|invalid|past/i, { timeout: 15000 });

        Logger.success('Expired Card error verified correctly');
    });

    test('Invalid CVC - Verify security code validation', async () => {
        Logger.step('Testing Invalid CVC scenario');

        await PaymentHelper.fillStripeAndPay(page, {
            cardNumber: APP_CONSTANTS.TEST_DATA.PAYMENT.CARD_NUMBER,
            cvc: '00' // 2 digits triggers incomplete frontend validation, preventing false success
        });

        const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
        await expect(stripeFrame.locator('body').or(page.locator('body')))
            .toContainText(/incomplete|invalid/i, { timeout: 15000 });

        Logger.success('Invalid CVC error verified correctly');
    });

    test('Successful Transaction - Verify happy path completion', async () => {
        Logger.step('Testing Successful Transaction (Happy Path)');

        await PaymentHelper.fillStripeAndPay(page); // Uses default valid card from constants

        // 6. Verify Success Redirect/Popup
        await PaymentHelper.verifySuccessAndContinue(page);

        Logger.success('Stripe Payment Validation suite completed successfully');
    });
});
