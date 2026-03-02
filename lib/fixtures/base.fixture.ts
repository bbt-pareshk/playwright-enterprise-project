import { test as base, expect, BrowserContext, TestInfo } from '@playwright/test';
import { allure } from 'allure-playwright';
import { ENV } from '../../config/env';

/**
 * Enterprise Base Fixture
 * -----------------------
 * Provides core stability enhancements and automated reporting metadata.
 */
export const test = base.extend({
  // Override context to apply global stability rules (like chat blocking)
  context: async ({ context }, use, testInfo) => {
    await applyEnterpriseContextSettings(context, testInfo);
    await use(context);
  },

  page: async ({ page }, use, testInfo) => {
    // Add Allure Metadata for better traceability
    allure.parameter('Project', testInfo.project.name);
    allure.parameter('Browser', testInfo.project.use.browserName ?? 'unknown');
    allure.parameter('BaseURL', testInfo.project.use.baseURL ?? 'unknown');
    allure.parameter('Worker', String(testInfo.workerIndex));

    await use(page);
  },
});

/**
 * Applies enterprise-grade stability settings to a browser context.
 * Currently: Blocks chat widgets to improve speed and avoid visual interference.
 */
export async function applyEnterpriseContextSettings(context: BrowserContext, testInfo: TestInfo) {
  /**
   * Only show the third-party chat widget (Gleap/Feedback button) if:
   * 1. The test is explicitly tagged with @chat-widget
   * 2. The test file is specifically 'chat-widget.spec.ts'
   * 3. ENV.ALLOW_CHAT is set to true
   */
  const isWidgetTest = testInfo.file.includes('chat-widget.spec');
  const allowWidget = testInfo.tags.includes('@chat-widget') || isWidgetTest || ENV.ALLOW_CHAT;

  if (!allowWidget) {
    // 1. Network level blocking for Gleap and common third-party chat libs
    // We avoid generic 'chat' keyword here to not break internal API calls
    await context.route(/gleap|livechatinc|intercom|drift/i, route => route.abort());

    // 2. DOM level hiding (fallback and visual cleanup)
    await context.addInitScript(() => {
      const style = document.createElement('style');
      style.setAttribute('data-test', 'chat-widget-hidden-style');
      style.innerHTML = `
        /* Target Gleap specifically and the known feedback button */
        #gleap-container,
        .bb-feedback-button,
        [id^="gleap"],
        [class*="gleap"] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `;
      document.documentElement.appendChild(style);

      // Aggressive removal loop for dynamic widgets
      const kill = () => {
        document
          .querySelectorAll('#gleap-container, .bb-feedback-button, [id^="gleap"]')
          .forEach(el => (el as HTMLElement).remove());
      };

      new MutationObserver(kill).observe(document, {
        childList: true,
        subtree: true,
      });

      kill();
    });
  }
}

export { expect };
