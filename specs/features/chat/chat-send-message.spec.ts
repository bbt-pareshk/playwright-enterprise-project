import { test } from '../../../lib/fixtures/index';
import { LoginPage } from '../../../lib/pages/auth/LoginPage';
import { ChatPage } from '../../../lib/pages/chat/ChatPage';
import { MyGroupsPage } from '../../../lib/pages/dashboard/MyGroupsPage';
import { ENV } from '../../../config/env';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { Logger } from '../../../lib/utils/Logger';
import { RuntimeStore } from '../../../lib/utils/RuntimeStore';
import { DataGenerator } from '../../../lib/utils/DataGenerator';

/**
 * We use a clean storage state to skip the global Leader login that usually runs first.
 * This allows us to control exactly when the User and Leader login.
 */


test.describe.serial('Chat – Send Message Flow', { tag: ['@smoke', '@critical'] }, () => {
    let groupName: string;
    let chatMessage: string;

    test(
        'Verify chat input field accepts text and shows typed content',
        async ({ memberPage }) => {

            const chatPage = new ChatPage(memberPage);
            const myGroupsPage = new MyGroupsPage(memberPage);
            groupName = APP_CONSTANTS.GROUP_NAME;
            chatMessage = DataGenerator.generateChatMessage();

            // 1. Navigation
            Logger.step('Step: Navigation to My Groups');
            await myGroupsPage.openMyGroups(true);

            // 2. Click specific Group
            Logger.step(`Step: Clicking on group "${groupName}"`);
            await myGroupsPage.clickGroupName(groupName);

            // 3. Enter Text and verify
            Logger.step('Step: Entering chat message and verifying input content');
            await chatPage.enterChatMessage(chatMessage);
            await chatPage.clickSend();

            await chatPage.verifyChatMessageVisible(chatMessage);
        }
    );

    test(
        'User can send and receive messages in group chat',
        async ({ leaderPage }) => {
            const chatPage = new ChatPage(leaderPage);
            const myGroupsPage = new MyGroupsPage(leaderPage);

            if (!groupName || !chatMessage) {
                test.skip(true, 'Shared state from previous step not available');
            }

            const leaderMessage = DataGenerator.generateChatMessage();

            // --- PHASE A: LEADER SENDS MESSAGE ---
            Logger.step('Phase A: Logging in as Leader to send a message');
            await myGroupsPage.openMyGroups(true);
            await myGroupsPage.clickJoinedGroupsTab();
            await myGroupsPage.clickGroupName(groupName);

            // Verify message received from User
            Logger.step('Step: Verifying last message from User is visible');
            await chatPage.verifyChatMessageVisible(chatMessage);

            await chatPage.enterChatMessage(leaderMessage);
            await chatPage.clickSend();
            Logger.success('Leader sent the message');
        }
    );
});
