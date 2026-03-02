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
  private readonly submitButton: Locator;

  // React-Select (Timezone)
  private readonly timezoneControl: Locator;
  private readonly selectedTimezoneLabel: Locator;
  private readonly timezonePlaceholder: Locator;
  private readonly timezoneOptions: Locator;

  constructor(page: Page) {
    super(page);

    this.modalRoot = page.locator('.chakra-modal__body');

    this.modalHeading = this.modalRoot.getByRole('heading', {
      name: new RegExp(UI_CONSTANTS.SESSION.SCHEDULE_SESSION, 'i'),
    });

    this.dateInput = this.modalRoot.locator('input[name="date"]');
    this.titleInput = this.modalRoot.locator('input[name="title"]');

    this.descriptionEditor = this.modalRoot
      .locator('[data-lexical-editor="true"]')
      .first();

    this.submitButton = this.modalRoot.getByRole('button', {
      name: new RegExp(`^${UI_CONSTANTS.SESSION.SCHEDULE_SESSION}$`, 'i'),
    });

    // Timezone React-Select
    this.timezoneControl = this.modalRoot.locator('.react-select__control');
    this.selectedTimezoneLabel = this.modalRoot.locator('.react-select__single-value');
    this.timezonePlaceholder = this.modalRoot.locator('.react-select__placeholder');

    // 🔥 Portal menu (outside modal)
    this.timezoneOptions = page.locator('.react-select__menu .react-select__option');
  }

  // --------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------

  async waitForVisible(): Promise<void> {
    Logger.step('Waiting for Create Session modal');

    await this.modalHeading.waitFor({
      state: 'visible',
      timeout: 20_000,
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

    await this.titleInput.fill(data.title);

    await this.descriptionEditor.click();
    await this.page.keyboard.type(data.description);

    await expect(this.submitButton).toBeEnabled();

    Logger.success('Required fields filled');
  }

  async submit(): Promise<void> {
    Logger.step('Submitting session');
    await this.submitButton.click();
  }

  async expectSessionCreated(): Promise<void> {
    Logger.step('Verifying session creation (modal closed)');

    await expect(this.modalHeading).toBeHidden({
      timeout: 10_000,
    });

    Logger.success('Create Session modal closed');
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
    await this.dateInput.type(formatted, { delay: 40 });
    await this.dateInput.press('Enter');

    await expect(this.dateInput).toHaveValue(formatted);

    Logger.info(`Session date set to ${formatted}`);
  }

  /**
   * Ensures a timezone is selected in React-Select
   * Handles:
   * - Already selected value
   * - Empty placeholder state
   * - Portal dropdown rendering
   */
  private async ensureTimezoneSelected(): Promise<void> {
    Logger.step('Ensuring timezone is selected');

    // If value already exists → do nothing
    if (await this.selectedTimezoneLabel.isVisible()) {
      const tz = (await this.selectedTimezoneLabel.textContent())?.trim();
      Logger.info(`Timezone already selected: ${tz}`);
      return;
    }

    Logger.info('No timezone selected — picking one');

    await this.timezoneControl.click();

    // Wait for portal menu
    const menu = this.page.locator('.react-select__menu');
    await menu.waitFor({ state: 'visible' });

    const firstOption = this.timezoneOptions.first();
    const tzToSelect = (await firstOption.textContent())?.trim();

    await firstOption.click();

    await expect(this.selectedTimezoneLabel).toHaveText(tzToSelect!);

    Logger.success(`Timezone selected: ${tzToSelect}`);
  }
}
