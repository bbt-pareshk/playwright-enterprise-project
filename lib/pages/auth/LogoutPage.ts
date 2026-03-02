// src/pages/auth/LogoutPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { UI_CONSTANTS } from '../../data/constants/ui-constants';

export class LogoutPage extends BasePage {
    private readonly profileIcon: Locator;
    private readonly logoutButtonInMenu: Locator;
    private readonly confirmLogoutButton: Locator;

    constructor(page: Page) {
        super(page);

        // 1. Profile Icon Locator: <button aria-label="User menu" ...>
        this.profileIcon = page.getByLabel(UI_CONSTANTS.AUTH.LABELS.USER_MENU);

        // 2. Logout Button in Menu Locator: <button role="menuitem" ...>Logout</button>
        this.logoutButtonInMenu = page.getByRole('menuitem', { name: UI_CONSTANTS.AUTH.LABELS.LOGOUT });

        // 3. Confirm Logout Button in Popup Locator: <button type="button" class="chakra-button ...">Logout</button>
        // Note: This button is in a confirmation dialog that appears after clicking logout in the menu.
        this.confirmLogoutButton = page.getByRole('button', { name: UI_CONSTANTS.AUTH.LABELS.LOGOUT, exact: true });
    }

    /**
     * Performs the logout flow:
     * 1. Click Profile Icon
     * 2. Click Logout in Menu
     * 3. Confirm Logout in Popup
     */
    async logout(): Promise<void> {
        Logger.step('User is logging out...');

        Logger.step('Clicking on Profile Icon');
        await this.click(this.profileIcon);

        Logger.step('Clicking on Logout Button in Menu');
        await this.click(this.logoutButtonInMenu);

        Logger.step('Clicking on Confirm Logout Button in Popup');
        await this.click(this.confirmLogoutButton);

        Logger.success('Logout action completed');
    }
}
