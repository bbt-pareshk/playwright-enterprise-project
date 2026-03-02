import { test, expect } from '../../../lib/fixtures/index';
import { ChatWidget } from '../../../lib/pages/chat/ChatWidget';
import { ROLES, UserRole } from '../../../lib/data/constants/roles';
import { ROUTES, URLS } from '../../../config/urls';
import { Logger } from '../../../lib/utils/Logger';

test.describe.serial('Chat Widget Visibility', { tag: ['@regression', '@optional', '@chat-widget'] }, () => {

  test('Verify chat widget is visible before login', async ({ page }) => {
    const chat = new ChatWidget(page);

    Logger.step('Verifying chat widget visibility in Guest state');
    // Navigating to Login page as it is a common place for chat widgets to appear
    await page.goto(ROUTES.login(), { waitUntil: 'domcontentloaded' });

    // Deterministic wait for Gleap injection (extended for CI stability)
    await expect.poll(() => chat.exists(), { timeout: 30_000 }).toBeTruthy();
    await expect(chat.launcher).toBeVisible();
    Logger.success('Chat widget is visible to Guest users on Login page');
  });

  test('Verify chat widget is visible after login', async ({ page, loginAs }) => {
    const chat = new ChatWidget(page);

    // Perform login using helper (picks up from /login state)
    Logger.step('Performing login via helper to check widget persistence');
    await loginAs(ROLES.LEADER);

    // Verify widget visibility in Authenticated state
    Logger.step('Verifying chat widget visibility in Authenticated state');
    await expect.poll(() => chat.exists(), { timeout: 30_000 }).toBeTruthy();
    await expect(chat.launcher).toBeVisible();
    Logger.success('Chat widget is visible to Authenticated users');
  });
});
