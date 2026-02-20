import { Page, Locator, expect, FrameLocator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { APP_CONSTANTS } from '../../data/constants/app-constants';
import { MESSAGES } from '../../data/constants/messages';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

export class GroupActivationPaymentPage extends BasePage {
  private readonly stripeFrame: FrameLocator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    // ONE Stripe iframe containing ENTIRE form
    this.stripeFrame = page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );

    this.submitButton = page.getByRole('button', {
      name: new RegExp(UI_CONSTANTS.GROUPS.BUTTONS.PAY_AND_ACTIVATE, 'i'),
    });
  }

  async waitForVisible(): Promise<void> {
    Logger.step('Waiting for Stripe full form');

    const cardNumber = this.stripeFrame.locator('#payment-numberInput');

    await cardNumber.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(cardNumber).toBeEditable();

    Logger.success('Stripe form ready');
  }

  async fillPaymentDetails(): Promise<void> {
    Logger.step('Filling Stripe full payment form');

    const frame = this.stripeFrame;

    // All fields live INSIDE iframe
    const country = frame.locator('#payment-countryInput');
    const postal = frame.locator('#payment-postalCodeInput');
    const cardNumber = frame.locator('#payment-numberInput');
    const expiry = frame.locator('#payment-expiryInput');
    const cvc = frame.locator('#payment-cvcInput');

    // ---- COUNTRY ----
    Logger.step('Selecting country');
    await country.selectOption(APP_CONSTANTS.TEST_DATA.PAYMENT.COUNTRY_CODE);

    // ---- POSTAL ----
    if (await postal.count()) {
      await postal.fill(APP_CONSTANTS.TEST_DATA.PAYMENT.POSTAL_CODE);
    }

    // ---- CARD NUMBER ----
    await cardNumber.click();
    await cardNumber.type(APP_CONSTANTS.TEST_DATA.PAYMENT.CARD_NUMBER, { delay: 40 });

    // ---- EXPIRY ----
    await expiry.click();
    await expiry.type(APP_CONSTANTS.TEST_DATA.PAYMENT.EXPIRY, { delay: 40 });

    // ---- CVC ----
    await cvc.click();
    await cvc.type(APP_CONSTANTS.TEST_DATA.PAYMENT.CVC, { delay: 40 });

    Logger.success('Stripe form filled');
  }

  async submitPayment(): Promise<void> {
    Logger.step('Submitting payment');

    // Wait until Stripe validation enables the button
    await expect(this.submitButton).toBeEnabled({ timeout: 20_000 });

    Logger.step('Clicking Pay button');
    await this.submitButton.click();

    await expect(
      this.page.getByText(new RegExp(MESSAGES.PAYMENT.SUCCESS, 'i'))
    ).toBeVisible({ timeout: 20_000 });

    Logger.success('Payment success confirmed');
  }

}
