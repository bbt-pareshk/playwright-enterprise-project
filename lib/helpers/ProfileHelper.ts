import { Page } from '@playwright/test';
import { ProfilePaymentPage } from '../pages/profile/ProfilePaymentPage';
import { Logger } from '../utils/Logger';

/**
 * ProfileHelper
 * -------------
 * Encapsulates profile-related business flows.
 */
export class ProfileHelper {

    /**
     * Configures a group's membership as "Free" via the Profile Payments page.
     */
    static async configureFreeMembership(page: Page, groupName: string) {
        Logger.step(`Configuring free membership for group: ${groupName}`);

        const profilePaymentPage = new ProfilePaymentPage(page);
        await profilePaymentPage.openProfilePaymentPage();
        await profilePaymentPage.selectGroup(groupName);
        await profilePaymentPage.selectFreePaymentAndSave(groupName);

        Logger.success(`Membership configuration completed for: ${groupName}`);
    }
}
