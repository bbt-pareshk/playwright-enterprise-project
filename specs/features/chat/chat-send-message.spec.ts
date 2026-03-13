import { test } from '../../../lib/fixtures/index';
import { ChatPage } from '../../../lib/pages/chat/ChatPage';
import { MyGroupsPage } from '../../../lib/pages/dashboard/MyGroupsPage';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { Logger } from '../../../lib/utils/Logger';
import { DataGenerator } from '../../../lib/utils/DataGenerator';

/**
 * Chat Journey: Multi-User Interaction
 * -----------------------------------
 * This spec validates the real-time chat journey between a Member and a Leader.
 * 
 * DESIGN PRINCIPLES:
 * 1. Multi-User Orchestration: Uses both memberPage and leaderPage in one journey.
 * 2. Visual Persistence: Verifies that messages sent by one user are visible to the other.
 * 3. Atomic Visibility: Uses test.step() to clearly separate Member and Leader actions.
 */
test.describe('Chat Journey - Multi-User Interaction', { tag: ['@smoke', '@chat', '@multi-user'] }, () => {

    // test('Chat Journey: Member sends message -> Leader receives and replies', async ({ memberPage, leaderPage }) => {
    //     const groupName = APP_CONSTANTS.GROUP_NAME;
    //     const memberMessage = DataGenerator.generateChatMessage();
    //     const leaderReply = DataGenerator.generateChatMessage();

    //     // --- PHASE 1: MEMBER ACTION ---
    //     await test.step('CHAT-01: Member - Navigate to group and send message', async () => {
    //         const memberMyGroups = new MyGroupsPage(memberPage);
    //         const memberChat = new ChatPage(memberPage);

    //         await memberMyGroups.openMyGroups(true);
    //         await memberMyGroups.clickGroupName(groupName);

    //         await memberChat.waitForChatLoaded(groupName);
    //         await memberChat.enterChatMessage(memberMessage);
    //         await memberChat.clickSend();
    //         await memberChat.verifyChatMessageVisible(memberMessage);
    //         Logger.info(`Member sent message: ${memberMessage}`);
    //     });

    //     // --- PHASE 2: LEADER ACTION ---
    //     await test.step('CHAT-02: Leader - Verify Member message and send reply', async () => {
    //         const leaderMyGroups = new MyGroupsPage(leaderPage);
    //         const leaderChat = new ChatPage(leaderPage);

    //         await leaderMyGroups.openMyGroups(true);
    //         await leaderMyGroups.clickJoinedGroupsTab();
    //         await leaderMyGroups.clickGroupName(groupName);

    //         await leaderChat.waitForChatLoaded(groupName);

    //         // Verify message received from Member
    //         await leaderChat.verifyChatMessageVisible(memberMessage);
    //         Logger.success(`Leader verified receipt of Member message: ${memberMessage}`);

    //         // Send reply
    //         await leaderChat.enterChatMessage(leaderReply);
    //         await leaderChat.clickSend();
    //         await leaderChat.verifyChatMessageVisible(leaderReply);
    //         Logger.info(`Leader sent reply: ${leaderReply}`);
    //     });

    //     // --- PHASE 3: FINAL VERIFICATION ---
    //     await test.step('CHAT-03: Member - Verify Leader reply in real-time', async () => {
    //         const memberChat = new ChatPage(memberPage);

    //         // Member should already be on the chat page from Phase 1
    //         await memberChat.verifyChatMessageVisible(leaderReply);
    //         Logger.success('Member successfully received Leader reply in real-time');
    //     });
    // });
});
