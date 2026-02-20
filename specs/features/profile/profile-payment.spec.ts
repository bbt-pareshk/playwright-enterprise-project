import { test } from '../../../lib/fixtures/index';

import { ProfilePaymentPage } from '../../../lib/pages/profile/ProfilePaymentPage';
import { Logger } from '../../../lib/utils/Logger';

/* =========================================================
   Profile – Payment Page Load
   Verifies that the user can access the billing/payment section.
========================================================= */
test.describe('Profile - Payment Section', () => {

   test(
      'Payment Page Load: Verify profile payment/billing section loads without errors',
      { tag: ['@regression'] },
      async ({ leaderPage }) => {
         const paymentPage = new ProfilePaymentPage(leaderPage);

         // 1. Navigate to Profile → Payments page
         Logger.step('Navigating to Profile Payments page');
         await paymentPage.openProfilePaymentPage();

         Logger.success('Profile › Payment section loaded successfully');
      }
   );
});
