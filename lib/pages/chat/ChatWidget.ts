import { Page, Locator } from '@playwright/test';

export class ChatWidget {
    readonly page: Page;
    readonly launcher: Locator;
    readonly icon: Locator;
    readonly notificationBubble: Locator;

    constructor(page: Page) {
        this.page = page;

        // Root widget container (most stable anchor)
        this.launcher = page.locator('.bb-feedback-button.gl-block');

        // Clickable icon inside launcher
        this.icon = this.launcher.locator('.bb-feedback-button-icon');

        // Red notification badge
        this.notificationBubble = this.launcher.locator(
            '.bb-notification-bubble'
        );
    }

    // ----------------------------
    // STATE METHODS (no assertions)
    // ----------------------------

    async isVisible(): Promise<boolean> {
        return this.launcher.isVisible();
    }

    async isHidden(): Promise<boolean> {
        return this.launcher.isHidden();
    }

    async hasNotification(): Promise<boolean> {
        const classAttr = await this.notificationBubble.getAttribute('class');
        return !!classAttr && !classAttr.includes('--hidden');
    }

    async exists(): Promise<boolean> {
        return (await this.launcher.count()) > 0;
    }

    // ----------------------------
    // ACTION METHODS
    // ----------------------------

    async open(): Promise<void> {
        await this.icon.click();
    }
}
