import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { CreateSessionModal } from '../session/CreateSessionModal';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

export class ChatPage extends BasePage {
  /* =========================================================
   * LOCATORS
   * ========================================================= */

  // Announcement banner displayed at the top of the chat page
  private readonly announcementBanner: Locator;
  private readonly announcementCloseBtn: Locator;

  // Chat page anchors used to confirm correct page and group context
  private readonly chatHeaderGroupName: Locator;
  private readonly chatTopBar: Locator;

  // Button that opens the chat action (kebab) menu
  private readonly chatMenuButton: Locator;

  // Create Session modal elements
  private readonly createSessionModalBody: Locator;
  private readonly createSessionModalHeading: Locator;

  private readonly chatInput: Locator;
  private readonly sendButton: Locator;

  constructor(page: Page) {
    super(page);

    /* ---------- Announcement ---------- */
    this.announcementBanner = page.locator('[data-testid="announceView"]');
    this.announcementCloseBtn = this.announcementBanner.getByRole('button', {
      name: new RegExp(UI_CONSTANTS.CHAT.BUTTONS.CLOSE, 'i'),
    });

    /* ---------- Chat Page Anchors ---------- */
    // Group name displayed in the chat header
    this.chatHeaderGroupName = page.locator(
      'p.chakra-text.css-722v25'
    );

    // Top bar container that appears only when the chat page is fully loaded
    this.chatTopBar = page.locator('div.css-79elbk');

    /* ---------- Chat Menu ---------- */
    this.chatMenuButton = page.getByRole('button', {
      name: new RegExp(UI_CONSTANTS.CHAT.BUTTONS.ACTION_MENU, 'i'),
    });

    /* ---------- Chat Messaging ---------- */
    this.chatInput = page.locator('div.editor-input');
    this.sendButton = page.locator(`button[aria-label="${UI_CONSTANTS.CHAT.BUTTONS.SEND_MESSAGE}"]`);

    /* ---------- Create Session Modal ---------- */
    this.createSessionModalBody = page.locator('div.chakra-modal__body');
    this.createSessionModalHeading =
      this.createSessionModalBody.getByRole('heading', {
        name: new RegExp(UI_CONSTANTS.CHAT.HEADINGS.SCHEDULE_SESSION, 'i'),
      });
  }

  /* =========================================================
   * CHAT ACTIONS
   * ========================================================= */

  async enterChatMessage(message: string): Promise<void> {
    Logger.step(`Entering chat message: ${message}`);
    // Lexical editor needs focus and sequential typing
    await this.chatInput.click();
    await this.chatInput.pressSequentially(message, { delay: 20 });
  }

  async clickSend(): Promise<void> {
    Logger.step('Clicking on Send button');
    await this.click(this.sendButton);
  }

  async verifyChatMessageVisible(message: string): Promise<void> {
    Logger.step(`Verifying chat message is visible: ${message}`);
    // Using the data-testid from the user's DOM snippet
    const messageLocator = this.page.locator('[data-testid="normalMessage"]').filter({ hasText: message }).last();

    try {
      // Ensure the element exists before trying to scroll
      await messageLocator.waitFor({ state: 'attached', timeout: 30_000 });
    } catch (e) {
      Logger.warn('Message not found. Refreshing page as fallback...');
      await this.page.reload({ waitUntil: 'networkidle' });
      await messageLocator.waitFor({ state: 'attached', timeout: 20_000 });
    }

    await messageLocator.scrollIntoViewIfNeeded();
    await expect(messageLocator).toBeVisible({ timeout: 10_000 });
    Logger.success('Chat message is visible');
  }

  async verifyChatInputText(expectedText: string): Promise<void> {
    Logger.step(`Verifying chat input contains text: ${expectedText}`);
    await this.chatInput.waitFor({ state: 'visible', timeout: 60_000 });
    // Since this is a contenteditable div, use toHaveText to check the content
    await expect(this.chatInput).toHaveText(expectedText, { timeout: 60_000 });
    Logger.success('Chat input content is verified');
  }

  /* =========================================================
   * COMMON INTERACTION GUARD
   * Ensures elements are attached, visible, and enabled
   * ========================================================= */
  private async waitUntilInteractable(
    locator: Locator,
    timeout = 20_000
  ): Promise<void> {
    await locator.waitFor({ state: 'attached', timeout });
    await expect(locator).toBeVisible({ timeout });
    await expect(locator).toBeEnabled({ timeout });
  }

  /* =========================================================
   * PAGE STATE ASSERTION
   * Confirms chat page is loaded and correct group is opened
   * ========================================================= */
  private async assertChatPageOpenedCorrectly(expectedGroupName: string): Promise<void> {
    Logger.step('Verifying chat page has loaded correctly');

    // Validate chat layout is rendered
    await expect(this.chatTopBar).toBeVisible({ timeout: 20_000 });
    Logger.success('Chat page layout is visible');

    // Validate correct group chat is opened
    const groupHeader = this.page.getByText(expectedGroupName, { exact: true });
    await expect(groupHeader.first()).toBeVisible({ timeout: 20_000 });

    Logger.success(
      `Chat page opened for expected group: ${expectedGroupName}`
    );
  }

  /* =========================================================
   * ANNOUNCEMENT HANDLER
   * Closes announcement banner if it blocks interactions
   * ========================================================= */
  private async closeAnnouncementIfExists(): Promise<void> {
    try {
      const appeared = await this.announcementBanner
        .waitFor({ state: 'attached', timeout: 2_000 })
        .then(() => true)
        .catch(() => false);

      if (!appeared) {
        Logger.info('No announcement banner present');
        return;
      }

      Logger.info('Announcement banner detected, attempting to close');

      await this.waitUntilInteractable(this.announcementCloseBtn);
      await this.announcementCloseBtn.click();

      // Ensure banner is fully removed or hidden before continuing
      await Promise.race([
        this.announcementBanner.waitFor({ state: 'detached', timeout: 10_000 }),
        this.announcementBanner.waitFor({ state: 'hidden', timeout: 10_000 }),
      ]);

      Logger.success('Announcement banner closed successfully');
    } catch (err) {
      Logger.warn(`Announcement close skipped due to error: ${err}`);
    }
  }

  /* =========================================================
   * MAIN FLOW
   * Opens Create Session modal from chat action menu
   * ========================================================= */
  async openCreateSessionFromChatMenu(expectedGroupName: string): Promise<CreateSessionModal | null> {
    try {
      Logger.step('Initiating Create Session flow from Chat menu');

      // Step 1: Ensure chat page and group context are correct
      await this.assertChatPageOpenedCorrectly(expectedGroupName);

      // Step 2: Close announcement banner if present
      await this.closeAnnouncementIfExists();

      // Step 3: Open chat action menu
      await this.waitUntilInteractable(this.chatMenuButton);
      await this.chatMenuButton.click();
      Logger.success('Chat action menu opened');

      // Step 4: Select "Schedule a Session" option
      const scheduleItem = this.page.getByRole('menuitem', {
        name: new RegExp(UI_CONSTANTS.CHAT.MENU_ITEMS.SCHEDULE_SESSION, 'i'),
      });

      await this.waitUntilInteractable(scheduleItem);
      await scheduleItem.click();
      Logger.success('"Schedule a Session" menu item selected');

      // Step 5: Verify Create Session modal is displayed
      await this.waitUntilInteractable(this.createSessionModalBody);
      await expect(this.createSessionModalHeading).toBeVisible();

      Logger.success('Create Session modal displayed successfully');

      return new CreateSessionModal(this.page);
    } catch (error) {
      Logger.error('Failed to open Create Session from Chat menu', error);

      // await this.page.screenshot({
      //   path: `chat-create-session-failure-${Date.now()}.png`,
      //   fullPage: true,
      // });

      return null;
    }
  }
}
