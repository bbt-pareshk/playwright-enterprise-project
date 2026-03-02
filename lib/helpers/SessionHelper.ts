import { Page } from '@playwright/test';
import { MyGroupsPage } from '../pages/dashboard/MyGroupsPage';
import { CreateSessionModal } from '../pages/session/CreateSessionModal';
import { Logger } from '../utils/Logger';
import { NavigationHelper } from './NavigationHelper';
import { APP_CONSTANTS } from '../data/constants/app-constants';

/**
 * SessionHelper
 * -------------
 * Encapsulates session-related business flows.
 */
export class SessionHelper {

    /**
     * Performs the full flow of creating a new session within a group.
     */
    static async createSession(page: Page, groupName: string, sessionTitle: string) {
        Logger.step(`Creating session "${sessionTitle}" in group: ${groupName}`);

        await NavigationHelper.gotoDashboard(page);
        const myGroups = new MyGroupsPage(page);

        const canCreate = await myGroups.openSavedGroupSupportingCreateSession(groupName);
        if (!canCreate) {
            throw new Error(`Group "${groupName}" does not support create session.`);
        }

        const createSessionModal = new CreateSessionModal(page);
        await createSessionModal.waitForVisible();
        await createSessionModal.fillRequiredFields({
            title: sessionTitle,
            description: APP_CONSTANTS.TEST_DATA.SESSION.DEFAULT_DESCRIPTION,
        });
        await createSessionModal.submit();

        Logger.success(`Session creation flow initiated for: ${sessionTitle}`);
    }
}
