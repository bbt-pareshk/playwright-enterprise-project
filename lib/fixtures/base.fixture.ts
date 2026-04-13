import { test as base, expect, BrowserContext, TestInfo } from '@playwright/test';
import { allure } from 'allure-playwright';
import { ENV } from '../../config/env';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegistrationPage } from '../pages/auth/RegistrationPage';

type BaseFixtures = {
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
};

/**
 * Enterprise Base Fixture
 * -----------------------
 * Provides core stability enhancements and automated reporting metadata.
 */
export const test = base.extend<BaseFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },

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
   * Only show third-party support widgets (Gleap, Chameleon, etc.) if:
   * 1. The test is explicitly tagged with @chat-widget or @keep-widget
   * 2. The test file is specifically 'chat-widget.spec.ts'
   * 3. ENV.ALLOW_CHAT is set to true
   */
  const filename = testInfo.file.toLowerCase();
  const isWidgetTest = filename.includes('chat-widget.spec') || filename.includes('onboarding-tour.spec');
  const allowWidget = testInfo.tags.includes('@chat-widget') || 
                      testInfo.tags.includes('@keep-widget') || 
                      isWidgetTest || 
                      ENV.ALLOW_CHAT;

  if (!allowWidget) {
    // 1. Network level blocking: Block scripts from common third-party providers
    // This prevents the widgets from even starting to load in most cases.
    await context.route(/gleap|chameleon|intercom|drift|hubspot|livechatinc/i, route => route.abort());

    // 2. DOM level "Surgical Removal" (Fallback for locally cached or inline scripts)
    await context.addInitScript(() => {
      // List of known third-party widget/onboarding root selectors
      const widgetSelectors = [
        '#gleap-container',
        '[class*="gleap-"]',
        '[id^="gleap"]',
        '.bb-feedback-button',
        '.bb-notification-bubble',
        '[class*="chameleon"]',
        '[id^="chameleon"]',
        '#chameleon-container',
        '.intercom-app',
        '.intercom-launcher-frame',
        '#hubspot-messages-iframe-container',
        'iframe[title*="Gleap"]',
        'iframe[src*="gleap"]',
        'iframe[src*="chameleon"]'
      ];

      // Add a CSS "Force Hide" layer as the fastest line of defense
      const style = document.createElement('style');
      style.setAttribute('data-test', 'enterprise-widget-kill-switch');
      style.innerHTML = `
        ${widgetSelectors.join(',\n')} {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;
      document.documentElement.appendChild(style);

      /**
       * Recursive function to find and remove widgets, including those 
       * hidden inside Shadow DOMs.
       */
      const surgicalRemoval = (root: Document | ShadowRoot) => {
        widgetSelectors.forEach(selector => {
          root.querySelectorAll(selector).forEach(el => {
            (el as HTMLElement).remove();
          });
        });

        // Drill into all sub-elements to find any hidden Shadow Roots
        root.querySelectorAll('*').forEach(el => {
          if (el.shadowRoot) surgicalRemoval(el.shadowRoot);
        });
      };

      // Periodic "Janitor" to handle dynamic re-injection
      const runJanitor = () => surgicalRemoval(document);
      
      // Observe all DOM changes to kill widgets the moment they are added
      new MutationObserver(runJanitor).observe(document, {
        childList: true,
        subtree: true,
      });

      // Initial sweep
      runJanitor();
    });
  }
}

export { expect };
