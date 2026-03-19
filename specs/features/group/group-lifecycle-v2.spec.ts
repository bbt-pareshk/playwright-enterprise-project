import { test, expect } from '../../../lib/fixtures/index';
import { GroupFlow } from '../../../lib/flows/GroupFlow';
import { SessionFlow } from '../../../lib/flows/SessionFlow';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { Logger } from '../../../lib/utils/Logger';
import { Page, BrowserContext } from '@playwright/test';
import path from 'path';

/**
 * Integrated Group & Session Lifecycle (V2)
 * ----------------------------------------
 * Validates the complete E2E journey from fresh leader setup to session creation.
 * Uses serial mode to maintain a persistent page state across atomic test reports.
 */
test.describe.serial('Integrated Group & Session Lifecycle', { 
    tag: ['@smoke', '@leader', '@group', '@session'] 
}, () => {

    let sharedContext: BrowserContext;
    let sharedPage: Page;
    let groupName: string;
    let sessionTitle: string;

    test.beforeAll(async ({ browser, baseURL }) => {
        groupName = DataGenerator.generateGroupName();
        sessionTitle = `L-Session: ${DataGenerator.firstName()}`;
        
        Logger.info(`[LIFECYCLE INIT] - Starting journey for Group: ${groupName}`);

        // Provision context with functional leader state
        sharedContext = await browser.newContext({
            storageState: path.resolve(process.cwd(), 'storage/auth/leader_functional.json'),
            baseURL: baseURL
        });
        sharedPage = await sharedContext.newPage();
    });

    test.afterAll(async () => {
        try {
            if (sharedPage) await sharedPage.close();
            if (sharedContext) await sharedContext.close();
        } catch (e) { /* Disposed */ }
        Logger.info(`[LIFECYCLE DONE] - Success for Group: ${groupName}`);
    });

    // ────────────────────────────────────────────────────────────────────────
    // PHASE 1: GROUP CREATION (GL-G IDs)
    // ────────────────────────────────────────────────────────────────────────

    test('GL-G1: Initialize Group Creation from Dashboard', async () => {
        Logger.step('STEP: Initializing Group Creation');
        await GroupFlow.startGroupCreation(sharedPage);
    });

    test('GL-G2: Fill Basic Profile Details (Tab 1)', async () => {
        Logger.step('STEP: Filling Tab 1 (Details)');
        await GroupFlow.fillTab1_BasicDetails(sharedPage, groupName);

        // Functional check: verify wizard progression
        const tabIndicator = sharedPage.locator('text=/Background|Pricing|Plan/i').first();
        await expect(tabIndicator).toBeVisible({ timeout: 15_000 });
    });

    test('GL-G3: Handle Professional Background (Tab 2 - Optional)', async () => {
        Logger.step('STEP: Handling Tab 2 (Bio)');
        await GroupFlow.handleTab2_BioOptional(sharedPage);
    });

    test('GL-G4: Configure Hosting Plan and Pricing (Tab 3)', async () => {
        Logger.step('STEP: Setting Pricing (Tab 3)');
        await GroupFlow.fillTab3_PricingMandatory(sharedPage);
    });

    test('GL-G5: Finalize Group Deployment (Tab 4)', async () => {
        Logger.step('STEP: Launching Group (Tab 4)');
        await GroupFlow.submitTab4_LaunchGroup(sharedPage);
    });

    test('GL-G6: Verify Redirection to Group Landing Page', async () => {
        Logger.assertion('Verifying landing on Group Details/Listing');
        await expect(sharedPage.getByText(groupName, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
        await expect(sharedPage.locator('text=/Settings|Members|Conversation/i').first()).toBeVisible();
        Logger.success('Phase 1: Group Creation Successful.');
    });

    // ────────────────────────────────────────────────────────────────────────
    // PHASE 2: SESSION MANAGEMENT (GL-S IDs)
    // ────────────────────────────────────────────────────────────────────────

    test('GL-S1: Navigate to Internal Sessions Tab', async () => {
        Logger.step('STEP: Navigating to Sessions Management');
        await SessionFlow.navigateToSessionsTab(sharedPage);
    });

    test('GL-S2: Schedule Atomic Session via Modal', async () => {
        Logger.step('STEP: Filling Session Creation Modal');
        await SessionFlow.createSession(sharedPage, sessionTitle);
    });

    test('GL-S3: Confirm Session Visibility in Listing', async () => {
        Logger.step('STEP: Verifying Session exists in list');
        await SessionFlow.verifySessionListed(sharedPage, sessionTitle);
        Logger.success(`[FULL JOURNEY VERIFIED] - Group: ${groupName} -> Session: ${sessionTitle}`);
    });
});
