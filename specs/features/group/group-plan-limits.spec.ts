import { test } from '../../../lib/fixtures/index';
import { AuthHelper } from '../../../lib/helpers/AuthHelper';
import { GroupHelper } from '../../../lib/helpers/GroupHelper';
import { ROLES } from '../../../lib/data/constants/roles';
import { MESSAGES } from '../../../lib/data/constants/messages';
import { ENV } from '../../../config/env';
import { Logger } from '../../../lib/utils/Logger';

/**
 * Group Plan Limits
 * -----------------
 * Verifies that the application correctly enforces active group limits based on the plan.
 * Uses pre-seeded accounts to skip registration/payment and focus on enforcement.
 * 
 * DESIGN PRINCIPLES:
 * 1. Resource Optimization: Uses @regression tag for deep verification.
 * 2. Robustness: Guards against missing credentials to avoid false failures.
 */
test.describe('Group Plan Limits Enforcement', { tag: ['@regression', '@leader'] }, () => {

    test.beforeEach(({}, testInfo) => {
        // Safe-guard: Skip if credentials aren't provided (prevents session loading errors)
        if (!ENV.LEADER_ACTIVE_HOSTING_PLAN_USERNAME || !ENV.LEADER_MULTI_GROUP_HOSTING_PLAN_USERNAME) {
            testInfo.annotations.push({ type: 'skip', description: 'Pre-seeded hosting plan credentials not found in ENV' });
            test.skip();
        }
    });

    test.describe('Active Plan Limit (1 Group)', () => {
        test.use({ storageState: 'storage/auth/leader_active_hosting_plan.json' });

        test('Enforce limit on Active Plan: 1 group maximum', async ({ page }) => {
            // Account is pre-seeded to be at its limit
            await GroupHelper.triggerLimitViaCreateGroup(
                page, 
                MESSAGES.GROUPS.ACTIVE_LIMIT_ACTIVE_PLAN
            );
        });
    });

    test.describe('Multi-Group Plan Limit (3 Groups)', () => {
        test.use({ storageState: 'storage/auth/leader_multi_group_hosting_plan.json' });

        test('Enforce limit on Multi-Group Plan: 3 groups maximum', async ({ page }) => {
            await GroupHelper.triggerLimitViaCreateGroup(
                page, 
                MESSAGES.GROUPS.ACTIVE_LIMIT_MULTI_PLAN
            );
        });
    });
});
