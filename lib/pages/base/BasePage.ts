import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage
 * ----------
 * A reusable parent class for all page objects.
 * Provides stable, enterprise-level helper methods
 * for navigation, clicking, input handling, and waits.
 */
export abstract class BasePage {
  protected readonly page: Page;

  /**
   * Constructor
   * Stores the Playwright Page instance so child classes can use it.
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a given URL.
   * Waits for DOM content to load to ensure the page is ready.
   *
   * @param url - Target URL
   * @param timeout - Max wait time (default 15s)
   */
  async goto(url: string, timeout = 15000) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout });
  }

  /* ============================
      BASIC CLICK
  ============================ */

  /**
   * Standard click method.
   * Waits until element is visible before clicking.
   *
   * @param locator - Playwright Locator
   * @param timeout - Max wait time
   */
  async click(locator: Locator, timeout = 30000) {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click({ timeout });
  }

  /**
   * Clicks a button and waits for a success message to appear.
   * Useful for actions like Save, Submit, Create, etc.
   *
   * Prevents race conditions by waiting for both click and success signal.
   *
   * @param button - Button to click
   * @param successMessage - Locator that confirms success
   * @param timeout - Max wait time
   */
  async clickAndWaitForSuccess(
    button: Locator,
    successMessage: Locator,
    timeout = 10_000
  ) {
    await button.waitFor({ state: 'visible', timeout });
    await expect(button).toBeEnabled({ timeout });

    await Promise.all([
      successMessage.waitFor({ state: 'visible', timeout }), // success signal
      button.click()
    ]);
  }

  /* ============================
     ROBUST ENTERPRISE CLICK
     Handles overlays, scrolling,
     animation, retry logic
  ============================ */

  /**
   * More reliable click for complex UIs.
   * Handles:
   * - Element not in viewport
   * - Overlay issues
   * - Minor animation delays
   *
   * Falls back to force click if normal click fails.
   *
   * @param locator - Element to click
   * @param timeout - Max wait time
   */
  async robustClick(locator: Locator, timeout = 15_000) {
    await locator.waitFor({ state: 'attached', timeout });
    await locator.scrollIntoViewIfNeeded();

    try {
      await locator.click({ timeout });
    } catch {
      // Fallback if element is covered or blocked by overlay
      await this.page.waitForTimeout(300);
      await locator.click({ force: true, timeout });
    }
  }

  /**
   * Waits until element exists in DOM.
   * Does NOT require visibility.
   *
   * @param locator - Target element
   * @param timeout - Max wait time
   */
  async waitForAttached(locator: Locator, timeout = 10000) {
    await locator.waitFor({ state: 'attached', timeout });
  }

  /* ============================
     STABLE ENTERPRISE INPUT
  ============================ */

  /**
   * Reliable input method for enterprise apps.
   * Handles:
   * - Clearing existing text
   * - Typing text
   * - Value verification
   *
   * @param locator - Input field
   * @param value - Text to enter
   */
  async stableFill(locator: Locator, value: string) {
    await locator.waitFor({ state: 'visible' });

    // Clear the field first
    await locator.clear();

    // Fill the value
    await locator.fill(value);

    // Verify value was set correctly
    await expect(locator).toHaveValue(value, { timeout: 5000 });
  }

  /**
   * Assertion helper to check visibility.
   *
   * @param locator - Element to verify
   * @param message - Optional custom error message
   */
  async expectVisible(locator: Locator, message?: string) {
    await locator.waitFor({ state: 'visible' });
    await expect(locator, message).toBeVisible();
  }
}
