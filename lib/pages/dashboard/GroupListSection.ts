import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../../utils/Logger';
import { Wait } from '../../utils/Wait';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

/**
 * GroupListSection
 * ----------------
 * Encapsulates all logic related to Group listing on Dashboard
 * (visibility, count, titles, member info, status icons, etc.)
 *
 * This is intentionally NOT a Page Object.
 * It represents a reusable UI section.
 */
export class GroupListSection {
  private readonly page: Page;
  private readonly groupCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.groupCards = page.locator('[data-testid="group-card"]');
  }

  /**
   * Waits until at least one group card is visible
   * Acts as a stable checkpoint for group listing load
   */
  async waitForGroupsToLoad(): Promise<void> {
    Logger.step('Waiting for group listing to load');
    await Wait.forVisible(this.groupCards.first());
    Logger.success('Group listing loaded');
  }

  /**
   * Returns total number of groups visible on dashboard
   */
  async getGroupCount(): Promise<number> {
    const count = await this.groupCards.count();
    Logger.step(`Found ${count} group(s) on dashboard`);
    return count;
  }

  /**
   * Verifies at least one group is displayed
   * Use this for smoke / sanity validation
   */
  async verifyGroupsArePresent(): Promise<void> {
    await this.waitForGroupsToLoad();
    const count = await this.getGroupCount();
    expect(count).toBeGreaterThan(0);
    Logger.success('At least one group is visible');
  }

  /**
   * Verifies that every group card has a visible title
   */
  async verifyEachGroupHasTitle(): Promise<void> {
    const count = await this.getGroupCount();

    for (let i = 0; i < count; i++) {
      const card = this.groupCards.nth(i);
      const title = card.locator('p.chakra-text, h4.chakra-text').first();

      await Wait.forVisible(title);
      const text = await title.textContent();

      expect(text?.trim().length).toBeGreaterThan(0);
    }

    Logger.success('All group cards have visible titles');
  }

  /**
   * Verifies member count text exists (e.g. "4 Members")
   * Does NOT validate exact number to avoid flaky data coupling
   */
  async verifyGroupMemberCountVisible(): Promise<void> {
    const count = await this.getGroupCount();

    for (let i = 0; i < count; i++) {
      const card = this.groupCards.nth(i);
      // Use regex from constant dynamically
      const memberText = card.locator(`text=/${UI_CONSTANTS.GROUPS.MEMBERS_REGEX}/i`);

      await Wait.forVisible(memberText);
    }

    Logger.success('Member count is visible for all groups');
  }

  /**
   * Clicks a group card by index
   * Useful for navigation tests
   */
  async openGroupByIndex(index: number): Promise<void> {
    Logger.step(`Opening group at index ${index}`);
    await this.groupCards.nth(index).click();
  }
}
