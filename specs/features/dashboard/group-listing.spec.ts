import { test, expect } from '../../../lib/fixtures/index';
import { MyGroupsPage } from '../../../lib/pages/dashboard/MyGroupsPage';
import { Logger } from '../../../lib/utils/Logger';

/* =========================================================
   Group Listing Load – Groups
   Verifies groups are visible on My Groups page
========================================================= */
test.describe('Groups – Listing', () => {

  test(
    'My Group listing loads with correct visibility and status',
    { tag: ['@smoke', '@critical'] },
    async ({ memberPage }, testInfo) => {

      testInfo.annotations.push({
        type: 'severity',
        description: 'critical',
      });

      Logger.step('Opening My Groups page');

      const myGroupsPage = new MyGroupsPage(memberPage);

      /**
       * Reuse existing, battle-tested navigation
       * This internally waits for group cards to load
       */
      await (myGroupsPage as any).openMyGroups(true);

      Logger.step('Verifying group cards are visible');

      const groupCards = memberPage.locator('[data-testid="group-card"]');
      const count = await groupCards.count();

      expect(count).toBeGreaterThan(0);

      await expect(groupCards.first()).toBeVisible();

      Logger.success(`My Group listing loaded successfully with ${count} groups`);
    }
  );
});
