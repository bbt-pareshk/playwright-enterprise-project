import { test } from '../../lib/fixtures/auth.fixture';
import { ROLES, UserRole } from '../../lib/data/constants/roles';
import { DashboardPage } from '../../lib/pages/dashboard/DashboardPage';
import { Logger } from '../../lib/utils/Logger';
import { ENV } from '../../config/env';
import path from 'path';
import fs from 'fs';

/**
 * Enterprise Authentication Setup
 * ------------------------------
 * Optimized for Smart Caching and Local Debugging.
 */
test.describe('Global Authentication Setup', () => {

    const rolesToAuthenticate: UserRole[] = [ROLES.MEMBER, ROLES.LEADER];

    // Enterprise Optimization: Only authenticate hosting plan accounts if credentials are provided
    if (ENV.LEADER_ACTIVE_HOSTING_PLAN_USERNAME) {
        rolesToAuthenticate.push(ROLES.LEADER_ACTIVE_HOSTING_PLAN);
    }
    if (ENV.LEADER_MULTI_GROUP_HOSTING_PLAN_USERNAME) {
        rolesToAuthenticate.push(ROLES.LEADER_MULTI_GROUP_HOSTING_PLAN);
    }
    if (ENV.LEADER_FUNCTIONAL_USERNAME) {
        rolesToAuthenticate.push(ROLES.LEADER_FUNCTIONAL);
    }

    for (const role of rolesToAuthenticate) {
        test(`Authenticate ${role}`, async ({ loginAs, page, context }) => {
            const statePath = path.resolve(process.cwd(), `storage/auth/${role}.json`);

            const isCI = ENV.IS_CI;
            const skipRequested = role === ROLES.MEMBER ? ENV.SKIP_MEMBER_AUTH : ENV.SKIP_LEADER_AUTH;
            const sessionExists = fs.existsSync(statePath);

            Logger.info(`[${role}] Debug - CI: ${isCI}, Skip: ${skipRequested}, File: ${sessionExists} at ${statePath}`);

            // Conditional Skip for Debugging/Caching
            if (!isCI && (skipRequested || sessionExists)) {
                const reason = skipRequested ? `SKIP_${role.toUpperCase()}_AUTH` : 'Smart Cache';
                Logger.info(`[${role}] skipping authentication based on: ${reason}`);
                test.skip();
                return;
            }

            await loginAs(role);

            // Self-Healing Setup: If we land on Welcome/Onboarding instead of Dashboard, 
            // we must clear them now or every downstream test will fail.
            const url = page.url();
            if (url.includes('/welcome') || url.includes('/onboarding')) {
                Logger.info(`[${role}] Landed on ${url}. Navigating to Dashboard...`);
                // Attempt to click 'Continue' or 'Skip' to reach dashboard
                await page.locator('button:has-text("Continue"), button:has-text("Skip"), button:has-text("Leader")').first().click().catch(() => {});
                // Wait dynamically for the next skip button or network idle instead of 2 seconds frozen
                await Promise.race([
                    page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {}),
                    page.locator('button:has-text("Skip")').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
                ]);
                // If still on onboarding, try one more skip
                if (page.url().includes('onboarding')) {
                   await page.locator('button:has-text("Skip")').first().click().catch(() => {});
                }
            }

            const dashboard = new DashboardPage(page);
            await dashboard.verifyDashboardLoaded();

            await context.storageState({ path: statePath });
            Logger.success(`${role} session captured at Dashboard state.`);
        });
    }
});
