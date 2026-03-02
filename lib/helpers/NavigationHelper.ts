import { Page } from '@playwright/test';
import { ROUTES } from '../../config/urls';
import { Logger } from '../utils/Logger';

/**
 * NavigationHelper
 * ----------------
 * Encapsulates common navigation flows across the application.
 */
export class NavigationHelper {

    /**
     * Navigates to the Dashboard page.
     */
    static async gotoDashboard(page: Page) {
        Logger.navigation('Navigating to Dashboard');
        await page.goto(ROUTES.dashboard(), { waitUntil: 'domcontentloaded' });
    }

    /**
     * Navigates to the Login page.
     */
    static async gotoLogin(page: Page) {
        Logger.navigation('Navigating to Login');
        await page.goto(ROUTES.login(), { waitUntil: 'domcontentloaded' });
    }

    /**
     * Navigates to the Registration page.
     */
    static async gotoRegistration(page: Page) {
        Logger.navigation('Navigating to Registration');
        await page.goto(ROUTES.register(), { waitUntil: 'domcontentloaded' });
    }

    /**
     * Navigates to the My Groups page.
     */
    static async gotoMyGroups(page: Page) {
        Logger.navigation('Navigating to My Groups');
        await page.goto(ROUTES.myGroup(), { waitUntil: 'domcontentloaded' });
    }

    /**
     * Navigates to the Profile page.
     */
    static async gotoProfile(page: Page) {
        Logger.navigation('Navigating to Profile');
        await page.goto(ROUTES.profile(), { waitUntil: 'domcontentloaded' });
    }
}
