// src/pages/group/CreateGroupPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Wait } from '../../utils/Wait';
import { Logger } from '../../utils/Logger';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

/**
 * CreateGroupPage
 * ----------------
 * Handles all interactions on the
 * "Create Group" flow
 */
export class CreateGroupPage extends BasePage {
  /* ---------------------------
     Locators
  ---------------------------- */

  private readonly groupNameInput: Locator;
  private readonly groupDescriptionInput: Locator;
  private readonly groupScheduleInput: Locator;
  private readonly selectTagsButton: Locator;
  private readonly doneButton: Locator;
  private readonly submitButton: Locator;
  private readonly finalSubmitButton: Locator;


  constructor(page: Page) {
    super(page);

    this.groupNameInput = page.locator('input[name="name"]').or(page.getByRole('textbox', { name: UI_CONSTANTS.GROUPS.CREATE.INPUTS.NAME }));
    this.finalSubmitButton = page.getByRole('button', { name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.SUBMIT_GROUP });


    this.groupDescriptionInput = page
      .locator(`p:has-text("${UI_CONSTANTS.GROUPS.CREATE.TEXT.DESCRIPTION_LABEL}")`)
      .locator('..')
      .locator('[data-lexical-editor="true"]');

    this.groupScheduleInput = page.getByRole('textbox', {
      name: UI_CONSTANTS.GROUPS.CREATE.INPUTS.SCHEDULE,
    });

    this.selectTagsButton = page.getByRole('button', { name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.SELECT_TAGS });
    this.doneButton = page.getByRole('button', { name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.DONE });
    this.submitButton = page.getByRole('button', { name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.CONTINUE });
  }

  /* ---------------------------
     Page Validation
  ---------------------------- */

  /**
   * Ensures Create Group page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    Logger.assertion('Create Group page is loaded');
    await Wait.forVisible(this.groupNameInput, 20_000);
  }


  /* ---------------------------
     Form Actions
  ---------------------------- */

  /**
   * Fills mandatory group details
   */
  async enterGroupDetails(
    name: string,
    description: string,
    schedule: string
  ): Promise<void> {
    Logger.step('Filling group details');

    await this.groupNameInput.fill(name);
    await this.groupDescriptionInput.click();
    await this.page.keyboard.type(description);
    //await this.groupScheduleInput.fill(schedule);
  }

  /**
   * Selects one random tag from available options
   */
  async selectRandomTag(): Promise<void> {
    Logger.step('Selecting a random group tag');

    // Open modal
    await this.selectTagsButton.click();

    const modal = this.page.getByRole('dialog');

    // WAIT for accordion to be rendered
    const accordionButtons = modal.locator(
      'button.chakra-accordion__button'
    );

    await accordionButtons.first().waitFor({ state: 'visible' });

    const categoryCount = await accordionButtons.count();
    if (categoryCount === 0) {
      throw new Error('No tag categories found in modal');
    }

    // 1. Open a random category
    const randomCategoryIndex = Math.floor(Math.random() * categoryCount);
    const selectedCategory = accordionButtons.nth(randomCategoryIndex);

    await selectedCategory.click();

    // 2. Wait for panel content to appear
    const visibleCheckboxes = modal.locator(
      'label.chakra-checkbox:visible'
    );

    await visibleCheckboxes.first().waitFor({ state: 'visible' });

    const checkboxCount = await visibleCheckboxes.count();
    if (checkboxCount === 0) {
      throw new Error('No tags found inside selected category');
    }

    // 3. Select a random checkbox
    const randomCheckboxIndex = Math.floor(Math.random() * checkboxCount);
    await visibleCheckboxes.nth(randomCheckboxIndex).click();

    // 4. Confirm selection
    await this.doneButton.click();
  }

  /**
   * Submits the group for Preview
   */
  async submitGroup(): Promise<void> {
    Logger.step('Submitting group creation Preview');
    await this.submitButton.click();
  }


  /**
   * Confirms final group submission
   */
  async confirmSubmit(): Promise<void> {
    Logger.step('Confirming group submission');
    await this.robustClick(this.finalSubmitButton);

  }
}
