import { test } from '../../../lib/fixtures/index';
import { SessionHelper } from '../../../lib/helpers/SessionHelper';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { Logger } from '../../../lib/utils/Logger';

test('Debug Session Creation UI', async ({ leaderPage }) => {
    // 1. Setup - use existing group name or generate one
    const groupName = 'PW_Group_20260305_115050_w2r05438d6'; // Use a known existing group
    const sessionTitle = DataGenerator.generateSessionName();

    Logger.info(`Debugging session creation for group: ${groupName}`);

    // Navigate to dashboard
    await leaderPage.goto('https://staging.mentalhappy.com/dashboard');

    try {
        await SessionHelper.createSession(leaderPage, groupName, sessionTitle);
        Logger.success('Session created successfully in debug mode');
    } catch (e: any) {
        Logger.error(`Session creation failed: ${e.message}`);
        await leaderPage.screenshot({ path: 'test-results/debug-session-failure.png', fullPage: true });

        // Take a snapshot of everything open
        const dialogs = leaderPage.locator('[role="dialog"]');
        const count = await dialogs.count();
        Logger.info(`Found ${count} dialogs at failure`);
        for (let i = 0; i < count; i++) {
            await dialogs.nth(i).screenshot({ path: `test-results/debug-dialog-${i}.png` });
        }
        throw e;
    }
});
