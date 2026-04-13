import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';

/**
 * GroupDetailsPage
 * ----------------
 * Represents the main dashboard/view of a specific group.
 * Accessible after group creation or selection from My Groups.
 */
export class GroupDetailsPage extends BasePage {
    private readonly sessionsTab: Locator;
    private readonly conversationsTab: Locator;
    private readonly membersTab: Locator;
    private readonly settingsTab: Locator;
    
    // Sessions View
    private readonly scheduleSessionBtn: Locator;
    private readonly sessionCards: Locator;

    // Chat / Conversation View
    private readonly chatActionMenuBtn: Locator;
    private readonly scheduleSessionMenuItem: Locator;

    constructor(page: Page) {
        super(page);

        // Main Tabs
        this.sessionsTab = page.getByRole('button', { name: /Sessions/i });
        this.conversationsTab = page.getByRole('button', { name: /Conversations/i });
        this.membersTab = page.getByRole('button', { name: /Members/i });
        this.settingsTab = page.getByRole('button', { name: /Settings/i });

        // Sessions Tab Content
        this.scheduleSessionBtn = page.getByRole('button', { name: /Schedule a Session/i });
        this.sessionCards = page.locator('div.css-e4xv3s'); // Based on provided DOM snippet

        // Chat View
        this.chatActionMenuBtn = page.getByLabel(/Chat box action menu/i);
        this.scheduleSessionMenuItem = page.getByRole('menuitem', { name: /Schedule a session/i });
    }

    async clickSessionsTab() {
        Logger.step('Navigating to Sessions tab');
        await this.click(this.sessionsTab);
        await expect(this.scheduleSessionBtn).toBeVisible({ timeout: 10_000 });
        Logger.success('Sessions tab active');
    }

    async clickScheduleSession() {
        Logger.step('Opening Schedule Session modal');
        
        // Wait for Loading spinner to disappear to avoid click interception
        await this.page.locator('span:has-text("Loading...")').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

        await this.robustClick(this.scheduleSessionBtn);

        // Wait and check if ANY modal is opening. If not, try again after a short delay
        // This solves issues where the SPA drops the first click during hydration/rendering
        const anyModal = this.page.locator('.chakra-modal__content, [role="dialog"]').last();
        try {
            await anyModal.waitFor({ state: 'visible', timeout: 5000 });
        } catch {
            Logger.warn('No modal visible after 5s, retrying Schedule a Session click...');
            // Force click as ultimate fallback
            await this.scheduleSessionBtn.click({ force: true });
        }
    }

    async openScheduleSessionFromChat() {
        Logger.step('Opening Schedule Session via Chat Menu');
        await this.click(this.conversationsTab);
        await this.click(this.chatActionMenuBtn);
        await this.click(this.scheduleSessionMenuItem);
    }

    async verifySessionExists(title: string) {
        Logger.assertion(`Verifying session exists: ${title}`);
        const sessionCard = this.sessionCards.filter({ hasText: title }).first();
        await expect(sessionCard).toBeVisible({ timeout: 15_000 });
        Logger.success('Session found in list');
    }

    async verifyPageLoaded(groupName: string) {
        Logger.step(`Verifying Group Details page loaded for: ${groupName}`);
        // The group name usually appears in the header or breadcrumb
        await expect(this.page.getByText(groupName).first()).toBeVisible({ timeout: 15_000 });
        Logger.success('Group Details page verified');
    }
}
