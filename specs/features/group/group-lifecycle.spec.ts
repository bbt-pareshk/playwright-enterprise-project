
import { test, expect } from '../../../lib/fixtures/index';
import { MESSAGES } from '../../../lib/data/constants/messages';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { Logger } from '../../../lib/utils/Logger';
import { GroupHelper } from '../../../lib/helpers/GroupHelper';
import { ProfileHelper } from '../../../lib/helpers/ProfileHelper';
import { SessionHelper } from '../../../lib/helpers/SessionHelper';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';

// -----------------------------------------------------------------------------------------
// SERIAL FLOW: Group Lifecycle
// -----------------------------------------------------------------------------------------
// Combined flow: Create -> Activate -> Configure Membership -> Create Session
// -----------------------------------------------------------------------------------------

test.describe.serial('Group Lifecycle Flow', { tag: ['@smoke', '@critical'] }, () => {

    test.beforeEach(async () => {
        // Multi-page enterprise flow needs more time
        test.setTimeout(300_000);
    });

    // Shared state
    let groupName: string;

    test('Step 1: Create Group',
        async ({ leaderPage }) => {
            Logger.info('Starting Step 1: Group Creation');
            groupName = DataGenerator.generateGroupName();

            await GroupHelper.createGroup(leaderPage, groupName);

            // Verify
            await AssertionHelper.verifyToastMessage(leaderPage, MESSAGES.GROUPS.CREATED_SUCCESS);
            Logger.success(`Step 1 Completed: Group ${groupName} created.`);
        });

    test('Step 2: Activate Group (Payment)',
        async ({ leaderPage }) => {
            Logger.info('Starting Step 2: Group Activation');

            if (!groupName) throw new Error('Group name not available from previous step.');

            await GroupHelper.activateGroup(leaderPage, groupName);

            Logger.success('Step 2 Completed: Group activated.');
        });

    test('Step 3: Configure Group Membership',
        async ({ leaderPage }) => {
            Logger.info('Starting Step 3: Configure Membership');

            if (!groupName) throw new Error('Group name not available');

            await ProfileHelper.configureFreeMembership(leaderPage, groupName);

            Logger.success('Step 3 Completed: Membership configured.');
        });

    test('Step 4: Create Session',
        async ({ leaderPage }) => {
            Logger.info('Starting Step 4: Create Session');

            if (!groupName) throw new Error('Group name not available');

            const sessionTitle = DataGenerator.generateSessionName();
            await SessionHelper.createSession(leaderPage, groupName, sessionTitle);

            // Verify
            await AssertionHelper.verifyToastMessage(leaderPage, MESSAGES.CHAT.NEW_MESSAGE);
            Logger.success('Step 4 Completed: Session created.');
        });

});

