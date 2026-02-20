import { Page, Locator, expect, Response } from '@playwright/test';
import { ENV } from '../../config/env';

export class Wait {

    /* ---------------------------
       Page / Navigation
    ---------------------------- */

    /**
     * Waits until the page has no ongoing network requests
     * Best used after navigation or login redirects
     */
    static async forNetworkIdle(page: Page, timeout = 10_000): Promise<void> {
        await page.waitForLoadState('networkidle', { timeout });
    }

    /**
     * Waits until DOM content is fully loaded
     * Faster than networkidle for SPA apps
     */
    static async forDomContentLoaded(page: Page, timeout = 10_000): Promise<void> {
        await page.waitForLoadState('domcontentloaded', { timeout });
    }

    /**
     * Waits until the page reaches full load state
     */
    static async forPageLoad(page: Page, timeout = 10_000): Promise<void> {
        await page.waitForLoadState('load', { timeout });
    }

    /**
     * Waits until the URL matches or contains expected value
     * Best for redirect verification
     */
    static async forURL(
        page: Page,
        urlPart: string | RegExp,
        timeout = 10_000,
    ): Promise<void> {
        await page.waitForURL(urlPart, { timeout });
    }

    /* ---------------------------
       Locator / Element
    ---------------------------- */

    /**
     * Waits until an element becomes visible
     */
    static async forVisible(
        locator: Locator,
        timeout = 10_000,
    ): Promise<void> {
        await locator.waitFor({ state: 'visible', timeout });
    }

    /**
     * Waits until an element is hidden or removed
     */
    static async forHidden(
        locator: Locator,
        timeout = 10_000,
    ): Promise<void> {
        await locator.waitFor({ state: 'hidden', timeout });
    }

    /* ---------------------------
       Utility / Debug
    ---------------------------- */

    /**
       * ⏸ Visual-only pause for LOCAL debugging.
       * ❗ Never use this for assertions or synchronization.
       * ❗ Skipped automatically in CI.
       */
    static async pause(
        page: Page,
        ms: number = 3_000
    ): Promise<void> {
        if (ENV.IS_CI) return;

        await page.waitForTimeout(ms);
    }
}
