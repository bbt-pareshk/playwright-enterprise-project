import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ROUTES, URLS } from '../../../config/urls';
import { Logger } from '../../utils/Logger';
import { Wait } from '../../utils/Wait';
import { GroupListSection } from './GroupListSection';
import { MyGroupsPage } from './MyGroupsPage';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';
import { MESSAGES } from '../../data/constants/messages';

export class DashboardPage extends BasePage {
  private readonly startGroupLink: Locator;
  private readonly findSupportGroupButton: Locator;
  private readonly searchSupportGroupsInput: Locator;
  private readonly noGroupsMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.startGroupLink = page.getByRole('link', { name: UI_CONSTANTS.DASHBOARD.START_GROUP_LINK });
    this.findSupportGroupButton = page.getByRole('button', { name: UI_CONSTANTS.DASHBOARD.FIND_SUPPORT_GROUP_BUTTON });
    this.searchSupportGroupsInput = page.getByPlaceholder(UI_CONSTANTS.DASHBOARD.SEARCH_PLACEHOLDER);
    this.noGroupsMessage = page.getByText(MESSAGES.DASHBOARD.NO_GROUPS);
  }

  async open(): Promise<void> {
    Logger.step('Opening dashboard');
    await this.page.goto(ROUTES.dashboard());
  }

  // DO NOT REMOVE — AUTH DEPENDENCY
  async verifyDashboardLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(URLS.DASHBOARD));
    await Wait.forVisible(this.findSupportGroupButton, 30_000);
    Logger.success('Login successful and dashboard loaded');
  }


  async clickStartGroup(): Promise<void> {
    Logger.step('Clicking on Start a Group');
    await Wait.forVisible(this.startGroupLink, 30_000);
    await this.startGroupLink.click();
  }

  async clickFindSupportGroup(): Promise<void> {
    Logger.step('Clicking on Find a support group');
    await Wait.forVisible(this.findSupportGroupButton);
    await this.findSupportGroupButton.click();
  }

  async searchGroup(groupName: string): Promise<void> {
    Logger.step(`Searching for group: ${groupName}`);
    await this.stableFill(this.searchSupportGroupsInput, groupName);
    // Add a small pause for filter to apply
    await Wait.pause(this.page, 1000);
  }

  async verifyGroupFound(groupName: string): Promise<void> {
    Logger.step(`Verifying group "${groupName}" is visible in results`);
    const groupCard = this.page.getByTestId('group-card').filter({ hasText: groupName });
    await this.expectVisible(groupCard, `Group "${groupName}" should be visible`);
  }

  async verifyNoGroupsMessageHidden(): Promise<void> {
    Logger.step('Verifying empty state message is hidden');
    await expect(this.noGroupsMessage).not.toBeVisible();
  }

}
