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

            const dashboard = new DashboardPage(page);
            await dashboard.verifyDashboardLoaded();
            await page.waitForTimeout(5000);

            await context.storageState({ path: statePath });
            Logger.success(`${role} session captured and cached.`);
        });
    }
});
