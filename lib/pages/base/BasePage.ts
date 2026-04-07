import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../../utils/Logger';

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
   * @param timeout - Max wait time for visibility
   */
  async expectVisible(locator: Locator, message?: string, timeout = 10_000) {
    await locator.waitFor({ state: 'visible', timeout });
    await expect(locator, message).toBeVisible({ timeout });
  }

  /**
   * Assertion helper to check if an element is disabled.
   *
   * @param locator - Element to verify
   * @param message - Optional custom error message
   * @param timeout - Max wait time for visibility
   */
  async expectDisabled(locator: Locator, message?: string, timeout = 10_000) {
    await locator.waitFor({ state: 'visible', timeout });
    await expect(locator, message).toBeDisabled({ timeout });
  }


  /**
   * Dismisses common support/onboarding popups (e.g., Chameleon, Intercom)
   * that might obscure elements during E2E runs.
   */
  async dismissSupportPopups() {
    const popupSelectors = [
      '[class*="chameleon"] button:has-text("Skip")',
      '[class*="chameleon"] button:has-text("Next")',
      'button:has-text("Got it")',
      'button:has-text("Dismiss")',
      'button[aria-label="Close"]',
      'button:has-text("Done")',
      '.chameleon-close-button',
      '.intercom-post-close',
      '[class*="chameleon"] button',
      'button:has-text("✕")',
      '.gleap-close-button',
      '.gleap-notification-container button',
      '[class^="gleap-"] button'
    ];

    Logger.info('Checking for generic support popups to dismiss...');

    // Some walkthroughs have multiple steps (1/2, 2/2). 
    // We loop a few times to clear them all.
    for (let i = 0; i < 4; i++) {
      let dismissedAny = false;

      // Try Escape key as first-line defense
      await this.page.keyboard.press('Escape').catch(() => { });

      // Use a JS-based "popup buster" to handle shadow DOM or complex overlays
      await this.page.evaluate(() => {
        const selectors = ['button', 'div[role="button"]', 'a[role="button"]'];
        // Specific labels for support/tour popups. 
        // We EXCLUDE "Continue" and "Skip" here to avoid clicking Onboarding buttons by mistake.
        const labels = [/Got it/i, /Dismiss/i, /Done/i, /Close/i, /✕/];

        // Chameleon specific targets
        const chameleonLabels = [/Next/i, /Skip Walkthrough/i, /End Tour/i];

        const clickPopups = (root: Document | ShadowRoot) => {
          selectors.forEach(sel => {
            root.querySelectorAll(sel).forEach(el => {
              const htmlEl = el as HTMLElement;
              const style = window.getComputedStyle(htmlEl);
              const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

              if (isVisible) {
                const text = htmlEl.innerText || htmlEl.getAttribute('aria-label') || '';
                const isChameleon = htmlEl.closest('[class*="chameleon"]') !== null;

                const shouldClick = labels.some(regex => regex.test(text)) ||
                  (isChameleon && chameleonLabels.some(regex => regex.test(text)));

                if (shouldClick) {
                  htmlEl.click();
                }
              }
            });
          });

          // Recurse into shadow DOMs
          root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) clickPopups(el.shadowRoot);
          });
        };

        clickPopups(document);
      }).catch(() => { });

      for (const selector of popupSelectors) {
        try {
          const popup = this.page.locator(selector).filter({ visible: true }).first();
          if (await popup.isVisible().catch(() => false)) {
            Logger.info(`Dismissing popup element: ${selector}`);
            await popup.click({ force: true, timeout: 3000 }).catch(() => { });
            await this.page.waitForTimeout(800);
            dismissedAny = true;
          }
        } catch (e) {
          // Ignore errors in dismissal
        }
      }
      if (!dismissedAny) break;
    }
  }
}
