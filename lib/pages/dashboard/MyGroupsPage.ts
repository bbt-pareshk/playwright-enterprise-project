// src/pages/dashboard/MyGroupsPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { Wait } from '../../utils/Wait';
import { ROUTES, URLS } from '../../../config/urls';
import { ChatPage } from '../chat/ChatPage';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

/**
 * Result returned when searching for an inactive group
 */
export type InactiveGroupResult =
  | { status: 'FOUND'; groupName: string }
  | { status: 'NOT_FOUND' };

export class MyGroupsPage extends BasePage {
  private readonly groupCards: Locator;

  constructor(page: Page) {
    super(page);
    this.groupCards = page.locator('[data-testid="group-card"]');
  }

  /**
   * Opens a specific group and determines whether Create Session is supported.
   */
  async openSavedGroupSupportingCreateSession(targetGroupName: string): Promise<boolean> {
    Logger.step(
      `Searching for group to create session: ${targetGroupName}`
    );

    await this.openMyGroups(true);

    const count = await this.groupCards.count();
    Logger.info(`Total groups detected: ${count}`);

    for (let i = 0; i < count; i++) {
      const card = this.groupCards.nth(i);

      if (!(await card.isVisible().catch(() => false))) continue;

      const snapshot = (await card.innerText().catch(() => '')).trim();

      // Continue until the saved group is found
      if (!snapshot.includes(targetGroupName)) continue;

      Logger.success(`Group matched: ${targetGroupName}`);

      // Inactive groups cannot create sessions
      if (
        await card
          .getByText(new RegExp(UI_CONSTANTS.GROUPS.STATUS.ACTIVATE, 'i'))
          .isVisible()
          .catch(() => false)
      ) {
        Logger.warn(
          'Group is inactive and does not support Create Session'
        );
        return false;
      }

      // Interest-only groups cannot create sessions
      if (
        await card
          .getByText(new RegExp(UI_CONSTANTS.GROUPS.STATUS.INTERESTED, 'i'))
          .isVisible()
          .catch(() => false)
      ) {
        Logger.warn(
          'Group is interest-only and does not support Create Session'
        );
        return false;
      }

      // Paid groups cannot create sessions
      const isPaidGroup = await card
        .locator('svg circle + line + line')
        .isVisible()
        .catch(() => false);

      if (isPaidGroup) {
        Logger.warn('Target group is paid and does not support Create Session');
        return false;
      }

      Logger.step('Opening target group chat');
      const chatPage = new ChatPage(this.page);

      await card.scrollIntoViewIfNeeded();
      await card.click();

      const opened = await chatPage.openCreateSessionFromChatMenu(targetGroupName);

      if (opened) {
        Logger.success(
          'Create Session modal successfully opened for target group'
        );
        return true;
      }

      Logger.warn('Target group does not expose Create Session action');
      return false;
    }

    Logger.warn('Target group was not found in My Groups listing');
    return false;
  }

  /**
   * Navigates to My Groups page and waits for group cards to load.
   */
  async openMyGroups(initial = false): Promise<void> {
    Logger.step('Navigating to My Groups page');

    await this.page.goto(ROUTES.myGroup(), {
      waitUntil: 'domcontentloaded',
    });

    if (initial) {
      Logger.step('Waiting for My Groups page content');
      // Wait for the tabs container instead of a card, as cards might not exist in the default tab
      await this.page.locator('div.chakra-tabs__tablist').waitFor({
        state: 'visible',
        timeout: 30_000,
      });
    }

    await this.page.waitForTimeout(500);
  }

  /**
   * Clicks on the Joined Groups tab.
   */
  async clickJoinedGroupsTab(): Promise<void> {
    Logger.step('Clicking on Joined Groups tab');
    const joinedGroupsTab = this.page.getByRole('tab', {
      name: new RegExp(UI_CONSTANTS.GROUPS.TABS.JOINED, 'i'),
    });
    await this.click(joinedGroupsTab);
    Logger.success('Joined Groups tab clicked');
  }

  /**
   * Clicks on a group card identifying it by name.
   */
  async clickGroupName(groupName: string): Promise<void> {
    Logger.step(`Clicking on group: ${groupName}`);
    const targetGroup = this.groupCards.filter({ hasText: groupName }).first();
    await this.click(targetGroup);
    Logger.success(`Group "${groupName}" clicked`);
  }

  /**
   * Attempts to activate a priority inactive group first.
   * Falls back to scanning all inactive groups if needed.
   */
  async openPriorityInactiveGroupAndRedirectToPayment(
    priorityGroupName: string
  ): Promise<InactiveGroupResult> {
    await this.openMyGroups(true);

    const visitedGroups = new Set<string>();
    const MAX_ATTEMPTS = 15;
    let priorityGroupHandled = false;

    // --------------------------------------------------
    // Phase 1: Priority group scan (Optimized)
    // --------------------------------------------------
    Logger.step(`Priority scan initiated for group: ${priorityGroupName}`);

    const card = this.groupCards.filter({ hasText: priorityGroupName }).first();

    if (await card.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const snapshot = (await card.innerText().catch(() => '')).trim();
      priorityGroupHandled = true;
      visitedGroups.add(snapshot);

      Logger.success(`Priority group found: ${snapshot}`);

      const isInactive = await card
        .getByText(new RegExp(UI_CONSTANTS.GROUPS.STATUS.ACTIVATE, 'i'))
        .isVisible()
        .catch(() => false);

      if (isInactive) {
        Logger.success('Priority group is inactive, opening activation flow');
        await card.scrollIntoViewIfNeeded();
        await card.click();

        const activated = await Promise.race([
          this.page
            .locator('#payment-element')
            .waitFor({ state: 'visible', timeout: 15_000 })
            .then(() => true)
            .catch(() => false),

          this.page
            .getByRole('button', { name: new RegExp(UI_CONSTANTS.GROUPS.BUTTONS.PAY_AND_ACTIVATE, 'i') })
            .waitFor({ state: 'visible', timeout: 15_000 })
            .then(() => true)
            .catch(() => false),

          this.page
            .waitForURL(/activate|subscription|payment/i, { timeout: 15_000 })
            .then(() => true)
            .catch(() => false),
        ]);

        if (activated) {
          Logger.success('Activation or payment page detected for priority group');
          return { status: 'FOUND', groupName: snapshot };
        }

        Logger.warn('Priority group selected but activation or payment UI was not detected');
        return { status: 'NOT_FOUND' };
      } else {
        Logger.info('Priority group is already active');
      }
    }

    if (!priorityGroupHandled) {
      Logger.info('Priority group not found, proceeding with fallback scan');
    }

    // --------------------------------------------------
    // Phase 2: Fallback scan using original logic
    // --------------------------------------------------
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const count = await this.groupCards.count();
      Logger.info(`Scan ${attempt + 1}: ${count} groups available`);

      let progressed = false;

      for (let i = 0; i < count; i++) {
        const card = this.groupCards.nth(i);

        if (!(await card.isVisible().catch(() => false))) continue;

        const snapshot = (await card.innerText().catch(() => '')).trim();
        if (!snapshot || visitedGroups.has(snapshot)) continue;

        visitedGroups.add(snapshot);
        progressed = true;

        const isInactive = await card
          .getByText(new RegExp(UI_CONSTANTS.GROUPS.STATUS.ACTIVATE, 'i'))
          .isVisible()
          .catch(() => false);

        if (!isInactive) {
          continue;
        }

        Logger.success(`Inactive group found during fallback scan: ${snapshot}`);

        await card.scrollIntoViewIfNeeded();
        await card.click();

        const activated = await Promise.race([
          this.page
            .locator('#payment-element')
            .waitFor({ state: 'visible', timeout: 15_000 })
            .then(() => true)
            .catch(() => false),

          this.page
            .getByRole('button', { name: new RegExp(UI_CONSTANTS.GROUPS.BUTTONS.PAY_AND_ACTIVATE, 'i') })
            .waitFor({ state: 'visible', timeout: 15_000 })
            .then(() => true)
            .catch(() => false),

          this.page
            .waitForURL(/activate|subscription|payment/i, { timeout: 15_000 })
            .then(() => true)
            .catch(() => false),
        ]);

        if (activated) {
          Logger.success('Activation or payment page detected');
          return { status: 'FOUND', groupName: snapshot };
        }

        Logger.warn(
          'Inactive group selected but activation or payment UI was not detected'
        );
        return { status: 'NOT_FOUND' };
      }

      if (!progressed) {
        Logger.warn('No additional inactive groups left to evaluate');
        break;
      }
    }

    Logger.warn('No inactive group found for activation');
    return { status: 'NOT_FOUND' };
  }
}
