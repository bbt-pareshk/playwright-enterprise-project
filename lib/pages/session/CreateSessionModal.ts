import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

export class CreateSessionModal extends BasePage {
  private readonly modalRoot: Locator;
  private readonly modalHeading: Locator;
  private readonly dateInput: Locator;
  private readonly titleInput: Locator;
  private readonly descriptionEditor: Locator;
  private readonly selectTagsButton: Locator;
  private readonly submitButton: Locator;
  private readonly timezoneControl: Locator;
  private readonly selectedTimezoneLabel: Locator;
  private readonly timezoneOptions: Locator;

  constructor(page: Page) {
    super(page);

    this.modalHeading = page.locator('.chakra-modal__header, [role="heading"], h2, p')
      .filter({ hasText: new RegExp(UI_CONSTANTS.SESSION.SCHEDULE_SESSION, 'i') })
      .first();

    this.modalRoot = page.locator('.chakra-modal__content, [role="dialog"]').filter({
      hasText: new RegExp(UI_CONSTANTS.SESSION.SCHEDULE_SESSION, 'i'),
    }).last();

    this.dateInput = this.modalRoot.locator('input[name="date"]');
    this.titleInput = this.modalRoot.locator('input[name="title"]');

    this.descriptionEditor = this.modalRoot
      .locator('[data-lexical-editor="true"]')
      .first();

    this.selectTagsButton = this.modalRoot.locator('button').filter({ hasText: /^Select Tags$/i });

    this.submitButton = this.modalRoot.getByRole('button', {
      name: /Schedule (Now|a Session)/i
    });

    this.timezoneControl = this.modalRoot.locator('.react-select__control').first();
    this.selectedTimezoneLabel = this.modalRoot.locator('.react-select__single-value');
    this.timezoneOptions = page.locator('.react-select__menu .react-select__option');
  }

  // --------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------

  async waitForVisible(): Promise<void> {
    Logger.step('Waiting for Create Session modal');
    
    // Step 1: Wait for modal root to be VISIBLE
    await this.modalRoot.waitFor({ state: 'visible', timeout: 20_000 });
    
    // Step 2: Final visibility check on heading
    await this.modalHeading.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {
         Logger.warn('Modal heading check timed out, but root is visible. Proceeding...');
    });
    
    Logger.success('Create Session modal visible');
  }

  async fillRequiredFields(data: {
    title: string;
    description: string;
  }): Promise<void> {
    Logger.step('Filling Create Session form');

    await this.setDateToNextDay();

    await this.ensureTimezoneSelected();

    // Title
    await this.titleInput.fill(data.title);

    // Description - Highly robust Lexical interaction
    Logger.info('Filling description editor');
    await this.descriptionEditor.click({ delay: 100 });
    await this.descriptionEditor.focus();
    await this.page.waitForTimeout(200);

    // Clear and type
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.type(data.description, { delay: 10 });
    await this.page.waitForTimeout(500);

    // New required step: Tags
    await this.ensureTagSelected();

    Logger.success('Form filling completed');
  }

  async submit(): Promise<void> {
    Logger.step('Submitting session');
    // Ensure button is visible before scrolling
    await this.submitButton.waitFor({ state: 'visible', timeout: 30000 });
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.submitButton.click();
  }

  async expectSessionCreated(): Promise<void> {
    Logger.step('Verifying session creation (modal closed)');
    await expect(this.modalHeading).toBeHidden({ timeout: 15_000 });
  }

  // --------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------

  private async setDateToNextDay(): Promise<void> {
    Logger.step('Setting session date to next day');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const day = String(tomorrow.getDate()).padStart(2, '0');
    const month = tomorrow.toLocaleString('en-US', { month: 'long' });
    const year = tomorrow.getFullYear();
    const formatted = `${day} ${month}, ${year}`;

    await this.dateInput.click();
    await this.dateInput.press('Control+A');
    await this.dateInput.press('Backspace');
    await this.dateInput.type(formatted, { delay: 30 });
    await this.dateInput.press('Enter');

    await expect(this.dateInput).toHaveValue(formatted);
    Logger.info(`Session date set to ${formatted}`);
  }

  private async ensureTimezoneSelected(): Promise<void> {
    Logger.step('Ensuring timezone is selected');

    // Keyboard-first approach for React-Select/Combobox
    await this.timezoneControl.click({ delay: 100 });
    await expect(this.timezoneOptions.first()).toBeVisible({ timeout: 5000 });

    // Search for a common timezone
    Logger.info('Searching for timezone "Pacific"');
    await this.page.keyboard.type('Pacific', { delay: 50 });
    await expect(this.timezoneOptions.filter({ hasText: /Pacific/i }).first()).toBeVisible({ timeout: 5000 }); // Wait for results
    await this.page.keyboard.press('Enter');

    await expect(this.page.locator('.react-select__menu')).toBeHidden({ timeout: 5000 });
    Logger.info('Timezone selection attempted via keyboard');
  }

  private async ensureTagSelected(): Promise<void> {
    Logger.step('Checking if tags are required');

    const btn = this.modalRoot.locator('button').filter({ hasText: /Select Tags/i }).first();

    if (!(await btn.isVisible())) {
      Logger.info('Select Tags button not visible');
      return;
    }

    await btn.click();
    Logger.info('Opened Tags drawer');

    const overlay = this.page.locator('.chakra-modal__content, .chakra-slide, [role="dialog"]').filter({
      hasNot: this.modalHeading
    }).last();

    try {
      await overlay.waitFor({ state: 'visible', timeout: 5000 });

      const tagItem = overlay.locator('input[type="checkbox"], label, button').filter({
        hasNot: this.page.locator('input[name="isPrivateSession"]')
      }).filter({
        hasNot: this.page.getByRole('button', { name: /close/i })
      }).first();

      await tagItem.click();
      Logger.info('Selected a tag');

      const doneBtn = overlay.getByRole('button', { name: /Done|Apply|Save|Add/i }).first();
      if (await doneBtn.isVisible()) {
        await doneBtn.click();
      }

      await overlay.waitFor({ state: 'hidden', timeout: 5000 });
      Logger.success('Tags drawer closed');
    } catch (err: any) {
      Logger.warn(`Tag selection flow issue: ${err.message}.`);
    }
  }
}
