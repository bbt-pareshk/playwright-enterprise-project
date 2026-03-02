// src/pages/group/CreateGroupPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Wait } from '../../utils/Wait';
import { Logger } from '../../utils/Logger';
import { DataGenerator } from '../../utils/DataGenerator';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';
import { APP_CONSTANTS } from '../../data/constants/app-constants';

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
  private readonly profilePhotoInput: Locator;
  private readonly photoUploadArea: Locator;
  private readonly professionalBioInput: Locator;
  private readonly selectTagsButton: Locator;
  private readonly doneButton: Locator;
  private readonly submitButton: Locator;
  private readonly finalSubmitButton: Locator;


  constructor(page: Page) {
    super(page);

    this.groupNameInput = page.locator('input[name="name"]').or(page.getByRole('textbox', { name: UI_CONSTANTS.GROUPS.CREATE.INPUTS.NAME }));

    this.groupDescriptionInput = page
      .locator(`p:has-text("${UI_CONSTANTS.GROUPS.CREATE.TEXT.DESCRIPTION_LABEL}")`)
      .locator('..')
      .locator('[data-lexical-editor="true"]');

    this.groupScheduleInput = page.getByRole('textbox', {
      name: UI_CONSTANTS.GROUPS.CREATE.INPUTS.SCHEDULE,
    });

    this.profilePhotoInput = page.locator('input[type="file"]');
    this.photoUploadArea = page.getByText(/upload photo/i).first();

    this.professionalBioInput = page.locator('p:has-text("Professional Bio")').locator('..').locator('[data-lexical-editor="true"]')
      .or(page.getByRole('textbox', { name: /Professional Bio/i }))
      .or(page.getByPlaceholder(/professional background|inspired you/i))
      .or(page.locator('textarea[name="aboutme"]'))
      .first();

    this.selectTagsButton = page.getByRole('button', { name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.SELECT_TAGS });
    this.doneButton = page.getByRole('button', { name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.DONE });

    // Pixel Perfect: Using more resilient locators for the multi-step submission process
    this.submitButton = page.getByRole('button', { name: /Continue|Review|Submit|Preview/i }).first();
    this.finalSubmitButton = page.getByRole('button', { name: /Submit Group|Finalize|Confirm|Create Group|Submit$/i })
      .or(page.locator('button').filter({ hasText: /^Submit Group$|^Submit$|^Confirm$|^Create Group$/i }))
      .or(page.getByRole('button', { name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.SUBMIT_GROUP }))
      .first();
  }

  /* ---------------------------
     Page Validation
  ---------------------------- */

  /**
   * Ensures Create Group page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    Logger.assertion('Create Group page is loaded');
    await this.dismissSupportPopups(); // Robustness: Clear any Chameleon/Intercom overlays
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

    // Pixel Perfect: Filling schedule if visible to ensure form is 'complete' and button enables
    if (await this.groupScheduleInput.isVisible()) {
      await this.groupScheduleInput.fill(schedule);
    }
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
    const accordionButtons = modal.locator('button[aria-expanded]');

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
    const visibleCheckboxes = modal.getByRole('checkbox').filter({ visible: true });

    await visibleCheckboxes.first().waitFor({ state: 'visible' });

    const checkboxCount = await visibleCheckboxes.count();
    if (checkboxCount === 0) {
      throw new Error('No tags found inside selected category');
    }

    // 3. Select a random checkbox
    const randomCheckboxIndex = Math.floor(Math.random() * checkboxCount);
    await visibleCheckboxes.nth(randomCheckboxIndex).click({ force: true });

    // 4. Confirm selection
    await this.robustClick(this.doneButton);
    await modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Submits the group for Preview
   */
  async submitGroup(): Promise<void> {
    Logger.step('Submitting group creation Preview');
    await this.robustClick(this.submitButton);
  }


  /**
   * Confirms final group submission
   * Handles both 2-step (Details -> Review) and 3-step (Details -> Bio -> Review) flows
   */
  async confirmSubmit(): Promise<void> {
    Logger.step('Confirming group submission');

    // Wait for transition to settle
    await this.page.waitForTimeout(2000);
    await this.dismissSupportPopups();

    // Pixel Perfect: Check if we hit the intermediate Professional Bio step (3-step flow)
    const isBioStep = await this.page.getByText(/Select tags that describe your background/i).isVisible();

    if (isBioStep) {
      Logger.info('Handling intermediate Bio/Profile step for new users');

      // =========================================================================
      // 🔒 LOCKED LOGIC: DO NOT TOUCH IMAGE UPLOAD OR FILE CHOOSER FALLBACK 🔒
      // =========================================================================
      // Updated: Target dummy image located dynamically via APP_CONSTANTS
      // removed visual `filechooser` fallback to avoid hanging the headless CI runner.

      const photoPath = require('path').resolve(process.cwd(), APP_CONSTANTS.DUMMY_PROFILE_IMAGE_PATH);

      Logger.step('Uploading professional photo');
      try {
        // Method 1: The standard Playwright hidden input approach
        await this.profilePhotoInput.setInputFiles(photoPath, { timeout: 8000 });
      } catch (e1) {
        Logger.error('Image upload strictly failed in CI due to missing dummy image file or unrendered DOM elements.');
        throw e1;
      }
      Logger.success('Photo upload processed');
      await this.page.waitForTimeout(1000); // Wait for upload processing
      // =========================================================================

      // Fill Bio text
      if (await this.professionalBioInput.isVisible()) {
        await this.professionalBioInput.click();
        await this.page.keyboard.type(DataGenerator.description());
        Logger.info('Professional Bio filled');
      }

      // Select background tags
      Logger.step('Selecting background tags');
      const tagsToSelect = ['Licensed Therapist', 'Social Worker', 'Counselor'];

      for (const tagText of tagsToSelect) {
        // Tag selection logic: find the element containing exactly the text
        const tag = this.page.getByText(tagText, { exact: true }).first();
        try {
          await tag.waitFor({ state: 'visible', timeout: 5000 });
          await tag.click({ force: true });
          Logger.info(`Clicked background tag: ${tagText}`);
          await this.page.waitForTimeout(300);
        } catch (e) {
          Logger.error(`Failed to locate/click tag: ${tagText}`);
        }
      }

      // Wait for "Continue to Review" button to enable
      const continueToReviewBtn = this.page.getByRole('button', { name: /Continue to Review/i });
      Logger.step('Waiting for submission button to enable');

      // In case photo upload or bio filling takes time to reflect on button state
      await expect(continueToReviewBtn).toBeEnabled({ timeout: 15000 });
      await this.robustClick(continueToReviewBtn);

      // Wait for transition to final review step
      await this.page.waitForTimeout(3000);
      await this.dismissSupportPopups();
    }

    // Final Review Step (Common to both 2rd and 3rd step flows)
    Logger.step('Reviewing final submission screen');
    await this.finalSubmitButton.waitFor({ state: 'visible', timeout: 15000 });

    try {
      // Give the frontend up to 5 seconds to formally enable the button after rendering it
      await expect(this.finalSubmitButton).toBeEnabled({ timeout: 5000 });
      Logger.step('Clicking final submit button');
      await this.robustClick(this.finalSubmitButton);
    } catch (error) {
      Logger.error('Final submit button is visible but DISABLED - potentially missing fields');
      await this.robustClick(this.finalSubmitButton); // Force click as fallback
    }
  }
}
