import { Page, expect } from '@playwright/test';
import { GroupDetailsPage } from '../pages/group/GroupDetailsPage';
import { CreateSessionModal } from '../pages/session/CreateSessionModal';
import { Logger } from '../utils/Logger';
import { DataGenerator } from '../utils/DataGenerator';

/**
 * SessionFlow
 * -----------
 * Atomic orchestration for Session Creation within a group.
 */
export class SessionFlow {

    /**
     * Navigates to the Sessions tab from Group Details.
     */
    static async navigateToSessionsTab(page: Page) {
        Logger.step('Navigating to Sessions from Group Details');
        const groupDetails = new GroupDetailsPage(page);
        await groupDetails.clickSessionsTab();
    }

    /**
     * Orchestrates Session Creation through the modal.
     */
    static async createSession(page: Page, sessionTitle?: string) {
        const groupDetails = new GroupDetailsPage(page);
        const sessionModal = new CreateSessionModal(page);
        
        const title = sessionTitle || `Session: ${DataGenerator.firstName()}`;
        const description = DataGenerator.description();

        Logger.step(`Starting Session Creation flow for: ${title}`);
        
        // Initial Click (We assume we are in the Sessions Tab)
        await groupDetails.clickScheduleSession();
        
        // Form Fill
        await sessionModal.waitForVisible();
        await sessionModal.fillRequiredFields({ 
            title: title, 
            description: description 
        });
        
        await sessionModal.submit();
        
        // Final Assertion: Modal should close
        await sessionModal.expectSessionCreated();
        Logger.success(`Session "${title}" submitted.`);
        
        return title;
    }

    /**
     * Checks if the session is present in the Sessions List.
     */
    static async verifySessionListed(page: Page, sessionTitle: string) {
        Logger.assertion(`Verifying session in list: ${sessionTitle}`);
        const groupDetails = new GroupDetailsPage(page);
        await groupDetails.verifySessionExists(sessionTitle);
        Logger.success('Session verified in listing');
    }
}
