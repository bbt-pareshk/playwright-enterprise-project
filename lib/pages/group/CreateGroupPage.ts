// lib/pages/group/CreateGroupPage.ts
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
 * Handles all interactions on the 3-step "Create Group" flow:
 *
 *   Tab 1 → Group Details      (Group Name, Cover Image, Description, Tags)
 *   Tab 2 → Professional Background  (conditional — first-time only)
 *              (Photo Profile, Name, Professional Role, Professional Bio)
 *   Tab 3 → Pricing Model      (conditional — select "Free" pricing)
 *   Tab 4 → Review & Submit    (preview only → click "Launch Group")
 *
 * All locators are DOM-verified against real application DOM captures.
 */
export class CreateGroupPage extends BasePage {

  /* ─────────────────────────────────────────────────────────
     TAB 1 — GROUP DETAILS
  ───────────────────────────────────────────────────────── */

  /** input[name="name"] */
  private readonly groupNameInput: Locator;

  /**
   * Hidden file input scoped to the "Cover Image" form-control group.
   * DOM: input[accept="image/jpeg,image/png,image/jpg"][type="file"] inside
   *      div[role="group"] that contains label "Cover Image".
   */
  private readonly coverImageInput: Locator;

  /**
   * Lexical rich-text editor for Group Description.
   * DOM: div[data-lexical-editor="true"] inside the "Group Description" form-control group.
   */
  private readonly groupDescriptionInput: Locator;

  /**
   * react-select control element. Clicking it opens the tag options dropdown.
   * DOM: div.react-select__control (first instance on the page)
   */
  private readonly selectTagsControl: Locator;

  /* ─────────────────────────────────────────────────────────
     TAB 2 — PROFESSIONAL BACKGROUND (CONDITIONAL)
  ───────────────────────────────────────────────────────── */

  /**
   * Hidden file input scoped to the "Photo Profile" form-control group.
   * DOM: input[type="file"] inside div[role="group"] containing label "Photo Profile".
   */
  private readonly profilePhotoInput: Locator;

  /**
   * Display name text input — pre-populated with the logged-in user's name.
   * DOM: input[name="displayName"]
   */
  private readonly displayNameInput: Locator;

  /**
   * Professional Role — native HTML <select> element.
   * DOM: select[name="professionalRole"]
   * Options: placeholder at index 0, first real option at index 1.
   */
  private readonly professionalRoleSelect: Locator;

  /**
   * Lexical rich-text editor for Professional Bio.
   * DOM: div[data-lexical-editor="true"] inside the "Professional Bio" form-control group.
   */
  private readonly professionalBioInput: Locator;

  /* ─────────────────────────────────────────────────────────
     TAB 3 — PRICING MODEL (CONDITIONAL)
  ───────────────────────────────────────────────────────── */

  /** "Pricing Model" heading text for tab detection. */
  private readonly pricingModelHeading: Locator;

  /** "Free" pricing model option card. Clicking it selects the free tier. */
  private readonly freePricingOption: Locator;

  /* ─────────────────────────────────────────────────────────
     NAVIGATION BUTTONS (shared across tabs)
  ───────────────────────────────────────────────────────── */

  /** "Continue" button — appears on Tab 1 and Tab 2 (DOM-verified exact text). */
  private readonly continueButton: Locator;

  /** "Launch Group" button — final submit on Tab 3 Review & Submit (DOM-verified). */
  private readonly launchGroupButton: Locator;

  /* ─────────────────────────────────────────────────────────
     CONSTRUCTOR
  ───────────────────────────────────────────────────────── */

  constructor(page: Page) {
    super(page);

    // ── Tab 1 ───────────────────────────────────────────────────────────────

    this.groupNameInput = page.locator('input[name="name"]');

    this.coverImageInput = page
      .locator('div[role="group"]')
      .filter({ hasText: UI_CONSTANTS.GROUPS.CREATE.TEXT.COVER_IMAGE_LABEL })
      .locator('input[type="file"]');

    this.groupDescriptionInput = page
      .locator('div[role="group"]')
      .filter({ hasText: UI_CONSTANTS.GROUPS.CREATE.TEXT.DESCRIPTION_LABEL })
      .locator('[data-lexical-editor="true"]');

    this.selectTagsControl = page.locator('div.react-select__control').first();

    // ── Tab 2 ───────────────────────────────────────────────────────────────

    this.profilePhotoInput = page
      .locator('div[role="group"]')
      .filter({ hasText: UI_CONSTANTS.GROUPS.CREATE.TEXT.PHOTO_PROFILE_LABEL })
      .locator('input[type="file"]');

    this.displayNameInput = page.locator(
      `input[name="${UI_CONSTANTS.GROUPS.CREATE.INPUTS.DISPLAY_NAME}"]`
    );

    this.professionalRoleSelect = page.locator(
      `select[name="${UI_CONSTANTS.GROUPS.CREATE.INPUTS.PROFESSIONAL_ROLE}"]`
    );

    this.professionalBioInput = page
      .locator('div[role="group"]')
      .filter({ hasText: UI_CONSTANTS.GROUPS.CREATE.TEXT.PROFESSIONAL_BIO_LABEL })
      .locator('[data-lexical-editor="true"]');

    // ── Tab 3 ───────────────────────────────────────────────────────────────

    this.pricingModelHeading = page.getByText('Set Group Pricing', { exact: true });

    // Select the "Free" option card.
    this.freePricingOption = page.locator('div.chakra-stack').filter({ hasText: /^Free$/ }).first().or(page.getByText('Free', { exact: true }));

    // ── Navigation ──────────────────────────────────────────────────────────

    // exact: true prevents matching "Finish later" or partial text buttons
    this.continueButton = page.getByRole('button', {
      name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.CONTINUE,
      exact: true,
    });

    this.launchGroupButton = page.getByRole('button', {
      name: UI_CONSTANTS.GROUPS.CREATE.BUTTONS.LAUNCH_GROUP,
      exact: true,
    });
  }

  /* ─────────────────────────────────────────────────────────
     PAGE VALIDATION
  ───────────────────────────────────────────────────────── */

  /**
   * Verifies the Create Group page has loaded (Tab 1 input visible).
   * Also dismisses any Chameleon / Intercom overlays.
   */
  async verifyPageLoaded(): Promise<void> {
    Logger.assertion('Create Group page is loaded');
    await this.dismissSupportPopups();
    await Wait.forVisible(this.groupNameInput, 20_000);
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 1 — GROUP DETAILS
  ══════════════════════════════════════════════════════════ */

  /**
   * Fills Group Name and Group Description.
   * Cover image upload is a separate step to keep responsibilities isolated.
   */
  async enterGroupDetails(name: string, description: string): Promise<void> {
    Logger.step('Filling Group Name');
    await this.groupNameInput.fill(name);

    Logger.step('Filling Group Description');
    await this.groupDescriptionInput.click();
    await this.page.keyboard.type(description);
  }

  /**
   * Uploads the Cover Image by setting files on the hidden file input (Tab 1).
   * The input is scoped to the "Cover Image" form-control so it cannot
   * accidentally target the profile photo input on Tab 2.
   */
  async uploadCoverImage(imagePath: string): Promise<void> {
    Logger.step('Uploading Cover Image');
    const resolvedPath = require('path').resolve(process.cwd(), imagePath);
    await this.coverImageInput.setInputFiles(resolvedPath);
    Logger.success('Cover image uploaded');
  }

  /**
   * Selects a tag from the react-select tags dropdown.
   *
   * Strategy:
   *   1. Click the react-select control to open the options menu.
   *   2. Wait for options to render.
   *   3. Click the second option (nth(1)) — the first real selectable tag,
   *      since nth(0) may be a group header or separator.
   */
  async selectTag(): Promise<void> {
    Logger.step('Opening Select Tags dropdown');
    await this.selectTagsControl.click();

    const options = this.page.locator('div.react-select__option');
    await options.first().waitFor({ state: 'visible', timeout: 10_000 });

    Logger.step('Selecting tag (second option — first real option)');
    await options.nth(1).click();
    Logger.success('Tag selected');
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 2 — PROFESSIONAL BACKGROUND (CONDITIONAL)
  ══════════════════════════════════════════════════════════ */

  /**
   * Returns true if the Professional Background tab is currently active.
   *
   * Detection strategy: The professionalRoleSelect (<select name="professionalRole">)
   * is only rendered when Tab 2 is active. It is not present on Tab 1 or Tab 3.
   * A 5-second timeout is used so we don't hang if the tab is not shown.
   */
  async isProfessionalBackgroundVisible(): Promise<boolean> {
    try {
      await this.professionalRoleSelect.waitFor({ state: 'visible', timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Uploads the Profile Photo via the hidden file input on Tab 2.
   * Scoped to the "Photo Profile" form-control group to avoid
   * collision with the Cover Image input on Tab 1.
   */
  async uploadProfilePhoto(imagePath: string): Promise<void> {
    Logger.step('Uploading Profile Photo');
    const resolvedPath = require('path').resolve(process.cwd(), imagePath);
    await this.profilePhotoInput.setInputFiles(resolvedPath);
    Logger.success('Profile photo uploaded');
  }

  /**
   * Completes all fields on the Professional Background tab:
   *   1. Profile Photo — upload via hidden file input
   *   2. Name          — only fill if the field is empty (pre-populated with username)
   *   3. Professional Role — native <select>: pick index 1 (first real option, skip placeholder)
   *   4. Professional Bio — Lexical rich-text editor
   */
  async fillProfessionalBackground(): Promise<void> {
    Logger.step('Filling Professional Background tab');

    // 1. Upload profile photo
    await this.uploadProfilePhoto(APP_CONSTANTS.DUMMY_PROFILE_IMAGE_PATH);

    // 2. Display name — enter only if field is empty
    const currentName = await this.displayNameInput.inputValue();
    if (!currentName || currentName.trim() === '') {
      Logger.info('Display name is empty — filling with generated name');
      await this.displayNameInput.fill(
        `${DataGenerator.firstName()} ${DataGenerator.lastName()}`
      );
    } else {
      Logger.info(`Display name already set: "${currentName}" — skipping`);
    }

    // 3. Professional Role — native <select>
    //    index 0 = placeholder "Select your Background Professional Role..."
    //    index 1 = first real option (e.g. "Licensed Therapist")
    Logger.step('Selecting Professional Role');
    await this.professionalRoleSelect.selectOption({ index: 1 });
    Logger.success('Professional Role selected');

    // 4. Professional Bio — Lexical rich-text editor
    Logger.step('Filling Professional Bio');
    await this.professionalBioInput.click();
    await this.page.keyboard.type(DataGenerator.description());
    Logger.success('Professional Bio filled');
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 3 — PRICING MODEL (CONDITIONAL)
  ══════════════════════════════════════════════════════════ */

  /**
   * Returns true if the Pricing Model tab is currently active.
   *
   * Detection strategy: Checks for the presence of the "Pricing Model" heading.
   */
  async isPricingModelVisible(): Promise<boolean> {
    try {
      // Use a shorter timeout as this is a conditional check
      await this.pricingModelHeading.waitFor({ state: 'visible', timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Selects the "Free" pricing model on Tab 3.
   */
  async selectFreePricing(): Promise<void> {
    Logger.step('Selecting "Free" Pricing Model');
    await this.freePricingOption.click();
    Logger.success('Free pricing model selected');
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION ACTIONS
  ══════════════════════════════════════════════════════════ */

  /**
   * Clicks the "Continue" button to advance to the next tab.
   * Used after Tab 1 (→ Tab 2 or Tab 3) and after Tab 2 (→ Tab 3).
   */
  async clickContinue(): Promise<void> {
    Logger.step('Clicking Continue');
    await this.continueButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.robustClick(this.continueButton);
  }

  /**
   * Clicks the "Launch Group" button on the Review & Submit tab (Tab 3).
   * Asserts the button is enabled before clicking to surface form validation failures early.
   */
  async launchGroup(): Promise<void> {
    Logger.step('Clicking Launch Group');
    // Tab 3 transition can be slow in CI, wait up to 30s
    await this.launchGroupButton.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(this.launchGroupButton).toBeEnabled({ timeout: 15_000 });
    await this.robustClick(this.launchGroupButton);
  }
}
