# 🤖 MASTER IMPLEMENTATION PROMPT
## Playwright Enterprise Framework — Member & Leader Flow Test Suite

---

> **Copy everything below this line and paste it to the AI assistant.**

---

## 🎯 YOUR MISSION

You are implementing a complete test suite for a Playwright Enterprise Framework (TypeScript).
You must implement **70 test cases** across **12 spec files**, along with supporting code changes.
You MUST work **file by file, in the exact order listed in the IMPLEMENTATION ORDER section**.
After each file, confirm what was created and move to the next.
Do NOT skip files. Do NOT mix files. Do NOT improvise structure.

---

## 📂 PROJECT ROOT

```
c:\Users\PK\Downloads\playwright-enterprise-framework-main\playwright-enterprise-framework-main\
```

All paths below are relative to this root.

---

## 🏗️ EXISTING FRAMEWORK — DO NOT BREAK THESE

### Architecture Rules (MANDATORY — READ BEFORE WRITING CODE)

1. **Every Page Object extends `BasePage`** from `lib/pages/base/BasePage.ts`
   - Use `this.click()`, `this.stableFill()`, `this.robustClick()`, `this.expectVisible()` — NOT raw Playwright methods
   - All locators are `private readonly` in constructor — never inline in methods

2. **All tests import from `lib/fixtures/index.ts`**
   - `import { test, expect } from '../../../lib/fixtures/index';`
   - NEVER import `@playwright/test` directly in spec files

3. **Fixtures provide pages**
   - `{ page }` → fresh anonymous page (for isolated validation tests)
   - `{ memberPage }` → pre-authenticated Member (storageState loaded from `storage/auth/member.json`)
   - `{ leaderPage }` → pre-authenticated Leader (storageState loaded from `storage/auth/leader.json`)

4. **All constants live in dedicated files — NEVER hardcode strings in tests**
   - Button labels → `UI_CONSTANTS` (`lib/data/constants/ui-constants.ts`)
   - Toast/error messages → `MESSAGES` (`lib/data/constants/messages.ts`)
   - Test credentials/data → `APP_CONSTANTS` (`lib/data/constants/app-constants.ts`)
   - URLs/routes → `URLS`, `ROUTES`, `ROUTE_PATHS` (`config/urls.ts`)

5. **All logging via `Logger`** from `lib/utils/Logger.ts`
   - Use `Logger.step()`, `Logger.success()`, `Logger.info()`, `Logger.warn()`, `Logger.assertion()`

6. **Serial flows use shared context**
   - `test.describe.serial(...)` + `let context: any; let page: any;` declared at top of describe block
   - `test.beforeAll(async ({ browser }) => { context = await browser.newContext(); page = await context.newPage(); })`
   - `test.afterAll(async () => { await context.close(); })`

7. **Tags are always arrays on the test**
   - `test('name', { tag: ['@smoke', '@critical', '@member'] }, async () => { ... })`

8. **`test.describe.serial` blocks must call `test.setTimeout(300_000)` inside `beforeAll` or `beforeEach`**

9. **DataGenerator for all dynamic test data** — `DataGenerator.generateEmail()`, `DataGenerator.firstName()`, `DataGenerator.generateGroupName()`

10. **Helpers encapsulate multi-step business flows** — Tests call helpers, helpers use Page Objects

---

## 📋 EXISTING CODE — CRITICAL REFERENCE

### Existing Files You Must NOT Recreate (they exist — just read and use them)

```
lib/pages/base/BasePage.ts                    ← abstract base, extends all POs
lib/pages/auth/RegistrationPage.ts            ← fillRegistrationForm(), verifyEmailWithOTP(), clickResendOTP()
lib/pages/auth/OnboardingPage.ts              ← selectGroupLeaderRole(), clickContinue(), clickSkip(), completeOnboardingFlow()
lib/pages/auth/LoginPage.ts                   ← login(), openLoginPage(), isLoggedIn()
lib/pages/auth/LogoutPage.ts                  ← logout()
lib/pages/dashboard/DashboardPage.ts          ← clickStartGroup(), clickFindSupportGroup(), verifyDashboardLoaded()
lib/pages/payment/GroupActivationPaymentPage.ts ← waitForVisible(), fillPaymentDetails(), submitPayment()
lib/pages/group/CreateGroupPage.ts            ← verifyPageLoaded(), enterGroupDetails(), selectRandomTag(), submitGroup(), confirmSubmit()
lib/pages/utils/MailinatorPage.ts             ← getOTPFromEmail(email)

lib/helpers/AuthHelper.ts                     ← ensureUserExists(), loginAs(), logout(), forceLogout()
lib/helpers/GroupHelper.ts                    ← createGroup(page, name), activateGroup(page, name)
lib/helpers/AssertionHelper.ts                ← verifyToastMessage(), verifyDashboardLoaded(), verifySuccessfulPayment(), verifyHeadingVisible()
lib/helpers/NavigationHelper.ts               ← gotoRegistration(), gotoLogin(), gotoDashboard(), gotoMyGroups(), gotoProfile()

lib/utils/DataGenerator.ts                    ← generateEmail(), firstName(), lastName(), generateGroupName(), description()
lib/utils/RuntimeStore.ts                     ← saveUserEmail(), getUserEmail(), saveUserVerified(), isUserVerified(), saveGroupName(), getGroupName()
lib/utils/Logger.ts                           ← step(), success(), info(), warn(), assertion(), navigation()
lib/fixtures/base.fixture.ts                  ← base test with Allure metadata + chat widget blocking
lib/fixtures/auth.fixture.ts                  ← extends base, provides memberPage and leaderPage
lib/fixtures/index.ts                         ← re-exports test and expect for use in all specs
```

### Key Constants Reference

```typescript
// UI_CONSTANTS (lib/data/constants/ui-constants.ts)
UI_CONSTANTS.AUTH.ONBOARDING.CONTINUE_AS_LEADER  = 'continue as a group leader'
UI_CONSTANTS.AUTH.ONBOARDING.SUPPORT_GROUP        = 'support group'         // 🆕 YOU MUST ADD THIS
UI_CONSTANTS.AUTH.ONBOARDING.CONTINUE             = 'continue'
UI_CONSTANTS.AUTH.ONBOARDING.SKIP                 = 'skip'
UI_CONSTANTS.AUTH.REGISTRATION.RESEND_OTP_BUTTON  = 'resend code'
UI_CONSTANTS.DASHBOARD.FIND_SUPPORT_GROUP_BUTTON  = 'Find a support group'
UI_CONSTANTS.DASHBOARD.START_GROUP_LINK           = 'Start a Group'
UI_CONSTANTS.GROUPS.BUTTONS.PAY_AND_ACTIVATE      = 'pay and activate group'

// MESSAGES (lib/data/constants/messages.ts)
MESSAGES.AUTH.REGISTRATION.EMAIL_CONFIRMED        = 'Email confirmed!'
MESSAGES.AUTH.REGISTRATION.EMAIL_UNAVAILABLE      = 'email is not available'
MESSAGES.AUTH.REGISTRATION.OTP_RESENT             = 'email sent'
MESSAGES.AUTH.REGISTRATION.FIRST_NAME_INVALID     = 'only letters are allowed'
MESSAGES.AUTH.REGISTRATION.LAST_NAME_INVALID      = 'only letters are allowed'
MESSAGES.AUTH.REGISTRATION.FIRST_NAME_REQUIRED    = 'firstname is required'
MESSAGES.AUTH.REGISTRATION.LAST_NAME_REQUIRED     = 'lastname is required'
MESSAGES.GROUPS.CREATED_SUCCESS                   = 'Group created successfully!'
MESSAGES.PAYMENT.SUCCESS                          = 'payment was successful!'

// APP_CONSTANTS (lib/data/constants/app-constants.ts)
APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT     = 'Password123!'
APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.SHORT       = 'Pass1!'
APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.LONG        = 'ThisPasswordIsWayToo...'
APP_CONSTANTS.TEST_DATA.PAYMENT.CARD_NUMBER       = '4242424242424242'
APP_CONSTANTS.TEST_DATA.PAYMENT.EXPIRY            = '1234'
APP_CONSTANTS.TEST_DATA.PAYMENT.CVC               = '123'
APP_CONSTANTS.TEST_DATA.PAYMENT.COUNTRY_CODE      = 'US'
APP_CONSTANTS.TEST_DATA.PAYMENT.POSTAL_CODE       = '560001'

// ROUTES / URLS / ROUTE_PATHS (config/urls.ts)
ROUTES.register()     →  full URL to /register
ROUTES.login()        →  full URL to /login
ROUTES.dashboard()    →  full URL to /groups
ROUTES.welcome()      →  full URL to /welcome
ROUTE_PATHS.VERIFY_EMAIL  = '/user/email/verify'
ROUTE_PATHS.WELCOME       = '/welcome'
ROUTE_PATHS.DASHBOARD     = '/groups'
URLS.REGISTER             = '/register'
URLS.VERIFY_EMAIL         = '/user/email/verify'
URLS.WELCOME              = '/welcome'
URLS.DASHBOARD            = '/groups'
```

---

## 🔄 THE TWO USER FLOWS (Core Business Logic)

```
SHARED START (both roles):
  1. Register  →  2. OTP Verify via Mailinator  →  3. /welcome page

ON /welcome — TWO BUTTONS SHOWN:
  ┌──────────────────────────────┐    ┌──────────────────────────────┐
  │  Continue as a Group Leader  │    │       Support Group          │
  └──────────────────────────────┘    └──────────────────────────────┘
           │ (LEADER PATH)                     │ (MEMBER PATH)
           ▼                                   ▼
   Leader Onboarding Steps              Member Onboarding Steps
   (Continue → Skip × 3)                (Skip × 3)
           │                                   │
           ▼                                   ▼
   Pricing Module                         Dashboard ✅
   (Free / Basic / Premium)
           │
     ┌─────┴──────┐
     │            │
  Free Plan   Basic/Premium
     │            │
  Group Create  Stripe Payment
     ✅          │
             Group Create ✅
```

---

## 📋 IMPLEMENTATION ORDER — FOLLOW EXACTLY

### ═══════════════════════════════════════════════
### BATCH 1: CODE CHANGES TO EXISTING FILES
### ═══════════════════════════════════════════════

---

#### FILE 1-A: `lib/data/constants/ui-constants.ts`
**ACTION: MODIFY** — Add `SUPPORT_GROUP` constant

**Find this block:**
```typescript
ONBOARDING: {
    CONTINUE_AS_LEADER: 'continue as a group leader',
    CONTINUE: 'continue',
    SKIP: 'skip',
},
```

**Replace with:**
```typescript
ONBOARDING: {
    CONTINUE_AS_LEADER: 'continue as a group leader',
    SUPPORT_GROUP: 'support group',
    CONTINUE: 'continue',
    SKIP: 'skip',
},
```

---

#### FILE 1-B: `lib/pages/auth/OnboardingPage.ts`
**ACTION: MODIFY** — Add Support Group role selection (member path)

Add the following to the class:

**In the constructor, after `this.continueAsLeaderButton` line:**
```typescript
// Role selection — Member path
this.continueAsSupportGroupButton = page.getByRole('button', {
    name: new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.SUPPORT_GROUP, 'i')
});
```

**Add private readonly field declaration (after `private readonly continueAsLeaderButton`):**
```typescript
private readonly continueAsSupportGroupButton: Locator;
```

But also make `continueAsLeaderButton` and `continueAsSupportGroupButton` **readonly** so specs can use them for direct assertions:
Change:
```typescript
private readonly continueAsLeaderButton: Locator;
private readonly continueAsSupportGroupButton: Locator;
```
To:
```typescript
readonly continueAsLeaderButton: Locator;
readonly continueAsSupportGroupButton: Locator;
```

**Add two new methods after `selectGroupLeaderRole()`:**
```typescript
/**
 * Selects "Support Group" role → member path
 */
async selectSupportGroupRole(): Promise<void> {
    Logger.step('Selecting Support Group role (Member path)');
    await this.continueAsSupportGroupButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.click(this.continueAsSupportGroupButton);
    Logger.success('Support Group role selected');
}

/**
 * Completes Member onboarding flow by choosing Support Group and skipping steps
 */
async completeMemberOnboardingFlow(): Promise<void> {
    Logger.step('Starting Member onboarding flow');
    await this.selectSupportGroupRole();
    await this.clickSkip();
    await this.clickSkip();
    await this.clickSkip();
    Logger.success('Member onboarding flow completed');
}
```

Also update `completeOnboardingFlow()` comment to clarify it is the LEADER flow:
```typescript
/**
 * Completes the entire LEADER onboarding flow
 * Step 1: Select Group Leader role
 * Step 2: Click Continue
 * Step 3–5: Skip three onboarding steps
 */
async completeOnboardingFlow(): Promise<void> { ... }  // keep body unchanged
```

---

#### FILE 1-C: `lib/helpers/NavigationHelper.ts`
**ACTION: MODIFY** — Add `gotoWelcome()` and `gotoPricing()` methods

Add after `gotoProfile()`:
```typescript
/**
 * Navigates to the Welcome / Onboarding page.
 */
static async gotoWelcome(page: Page) {
    Logger.navigation('Navigating to Welcome / Onboarding');
    await page.goto(ROUTES.welcome(), { waitUntil: 'domcontentloaded' });
}
```

---

#### FILE 1-D: `lib/data/constants/messages.ts`
**ACTION: MODIFY** — Add missing pricing/onboarding messages

Add inside `MESSAGES`:
```typescript
ONBOARDING: {
    ROLE_SELECTED: 'role selected',
},
PRICING: {
    FREE_PLAN_SELECTED: 'free',
    PLAN_SELECTED: 'plan selected',
},
```

---

### ═══════════════════════════════════════════════
### BATCH 2: NEW PAGE OBJECTS
### ═══════════════════════════════════════════════

---

#### FILE 2-A: `lib/pages/pricing/PricingPage.ts`
**ACTION: CREATE NEW FILE**

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { Logger } from '../../utils/Logger';
import { ROUTES } from '../../../config/urls';

/**
 * PricingPage
 * -----------
 * Handles the Pricing Module page shown to Leaders after onboarding.
 * Contains plan selection for Free, Basic, and Premium tiers.
 */
export class PricingPage extends BasePage {
    // Plan cards
    readonly freePlanCard: Locator;
    readonly basicPlanCard: Locator;
    readonly premiumPlanCard: Locator;

    // CTA buttons within each plan
    readonly freePlanButton: Locator;
    readonly basicPlanButton: Locator;
    readonly premiumPlanButton: Locator;

    // Stripe payment iframe
    readonly stripeFrame: Locator;

    constructor(page: Page) {
        super(page);

        // Plan cards — identify by heading text within card
        this.freePlanCard = page.locator('[data-plan="free"], .plan-card').filter({ hasText: /free/i }).first();
        this.basicPlanCard = page.locator('[data-plan="basic"], .plan-card').filter({ hasText: /basic/i }).first();
        this.premiumPlanCard = page.locator('[data-plan="premium"], .plan-card').filter({ hasText: /premium/i }).first();

        // CTA buttons — flexible matching
        this.freePlanButton = page.getByRole('button', { name: /free|get started|start free/i }).first();
        this.basicPlanButton = page.getByRole('button', { name: /basic|choose basic|select basic/i }).first();
        this.premiumPlanButton = page.getByRole('button', { name: /premium|choose premium|select premium/i }).first();

        // Stripe iframe presence check
        this.stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]').locator('#payment-numberInput');
    }

    async goto(): Promise<void> {
        Logger.step('Navigating to Pricing page');
        // Pricing is typically at /pricing or shows post-onboarding; navigate to /welcome as fallback
        await this.page.goto(ROUTES.welcome(), { waitUntil: 'domcontentloaded' });
    }

    async selectFreePlan(): Promise<void> {
        Logger.step('Selecting Free Plan');
        await this.click(this.freePlanButton);
        Logger.success('Free Plan selected');
    }

    async selectBasicPlan(): Promise<void> {
        Logger.step('Selecting Basic Plan');
        await this.click(this.basicPlanButton);
        Logger.success('Basic Plan selected');
    }

    async selectPremiumPlan(): Promise<void> {
        Logger.step('Selecting Premium Plan');
        await this.click(this.premiumPlanButton);
        Logger.success('Premium Plan selected');
    }

    async verifyAllPlansVisible(): Promise<void> {
        Logger.step('Verifying all pricing plans are visible');
        await expect(this.page.getByText(/free/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(this.page.getByText(/basic/i).first()).toBeVisible({ timeout: 5_000 });
        await expect(this.page.getByText(/premium/i).first()).toBeVisible({ timeout: 5_000 });
        Logger.success('All 3 pricing plans visible');
    }

    async verifyStripeFormVisible(): Promise<void> {
        Logger.step('Verifying Stripe payment form is visible');
        await expect(this.stripeFrame).toBeVisible({ timeout: 20_000 });
        Logger.success('Stripe form visible');
    }

    async verifyStripeFormNotVisible(): Promise<void> {
        Logger.step('Verifying Stripe payment form is NOT visible');
        await expect(this.stripeFrame).not.toBeVisible({ timeout: 5_000 });
        Logger.success('Stripe form correctly absent for Free plan');
    }
}
```

---

### ═══════════════════════════════════════════════
### BATCH 3: NEW SPEC FILES (10 FILES)
### ═══════════════════════════════════════════════

**MANDATORY SPEC FILE RULES:**
- Every test file starts with imports from `lib/fixtures/index`
- Every `test.describe` block has a **clear, human-readable title**
- Every test has `{ tag: [...] }` as second argument — always an array
- Test IDs (TC-XXX-NN) appear in the test name as prefix e.g. `'TC-ROLE-01: Welcome screen loads...'`
- Serial describe blocks MUST use shared `context` + `page` (not fixture pages)
- Isolated describe blocks MUST use fixture pages (`{ page }`, `{ memberPage }`, `{ leaderPage }`)
- Step comments (numbered) explain what each block does
- `Logger.step()` and `Logger.success()` bracket every major action

---

#### FILE 3-A: `specs/features/onboarding/role-selection.spec.ts`
**5 tests — Pattern: Isolated**

Write these 5 test cases:

| TC-ROLE-01 | `Welcome screen (Onboarding) URL is /welcome` | tag: `@smoke @critical` | Precondition: user is on welcome page. Use `page` fixture, navigate to `ROUTES.welcome()`. Assert URL matches WELCOME regex. |
| TC-ROLE-02 | `"Continue as Group Leader" button is visible on Welcome screen` | tag: `@smoke @leader` | Use `page`, navigate to welcome, assert `onboarding.continueAsLeaderButton` toBeVisible |
| TC-ROLE-03 | `"Support Group" button is visible on Welcome screen` | tag: `@smoke @member` | Use `page`, navigate to welcome, assert `onboarding.continueAsSupportGroupButton` toBeVisible |
| TC-ROLE-04 | `Clicking "Continue as Group Leader" navigates Leader to next onboarding step` | tag: `@smoke @critical @leader` | Use `leaderPage`, navigate to welcome, click leader button, verify URL changed OR next step element is visible |
| TC-ROLE-05 | `Clicking "Support Group" navigates Member to member onboarding step` | tag: `@smoke @critical @member` | Use `memberPage`, navigate to welcome, click support group button, verify URL changed OR next step is shown |

---

#### FILE 3-B: `specs/features/onboarding/member-onboarding.spec.ts`
**4 tests — Pattern: Isolated with `memberPage` fixture**

| TC-MOB-01 | `Member: Onboarding page loads after Support Group selection` | `@smoke @member` | Navigate to welcome, select support group, verify page updated |
| TC-MOB-02 | `Member: Skip button navigates through onboarding steps` | `@regression @member` | Navigate to welcome, select support group, click skip, verify step progresses |
| TC-MOB-03 | `Member: Completing all onboarding steps redirects to Dashboard` | `@smoke @critical @member` | Use `memberPage`, navigate to welcome, call `onboarding.completeMemberOnboardingFlow()`, verify dashboard URL |
| TC-MOB-04 | `Member: "Continue as Group Leader" button is NOT clicked for member path` | `@regression @member` | Verify member lands on dashboard (not pricing) after complete member flow |

---

#### FILE 3-C: `specs/features/onboarding/leader-onboarding.spec.ts`
**3 tests — Pattern: Isolated with `leaderPage` fixture**

| TC-LOB-01 | `Leader: Leader onboarding step visible after role selection` | `@smoke @critical @leader` | Use `leaderPage`, navigate to welcome, call `onboarding.selectGroupLeaderRole()`, verify next step visible |
| TC-LOB-02 | `Leader: Continue button moves leader through onboarding steps` | `@regression @leader` | Use `leaderPage`, navigate to welcome, select leader role, click continue, verify page progressed |
| TC-LOB-03 | `Leader: Completing all leader onboarding steps proceeds to next destination` | `@smoke @critical @leader` | Use `leaderPage`, navigate to welcome, call `onboarding.completeOnboardingFlow()`, verify URL moved forward from /welcome |

---

#### FILE 3-D: `specs/features/pricing/pricing-module.spec.ts`
**8 tests — Pattern: Isolated with `leaderPage` fixture**

| TC-PRC-01 | `Pricing page loads with plan cards visible` | `@smoke @critical @leader` | Use `leaderPage`, verify Free/Basic/Premium text visible |
| TC-PRC-02 | `Free plan card displays name and CTA button` | `@smoke @leader` | Verify "free" text and a CTA button exist |
| TC-PRC-03 | `Basic plan card displays name, price, and CTA button` | `@smoke @leader` | Verify "basic" text and CTA button exist |
| TC-PRC-04 | `Premium plan card displays name, price, and CTA button` | `@smoke @leader` | Verify "premium" text and CTA button exist |
| TC-PRC-05 | `Selecting Free Plan does not trigger Stripe payment form` | `@regression @critical @leader` | Click free plan → verify Stripe iframe NOT visible |
| TC-PRC-06 | `Selecting Basic Plan opens Stripe payment form` | `@regression @critical @leader` | Click basic plan → verify Stripe iframe IS visible |
| TC-PRC-07 | `Selecting Premium Plan opens Stripe payment form` | `@regression @critical @leader` | Click premium plan → verify Stripe iframe IS visible |
| TC-PRC-08 | `Member cannot access Pricing (no plan cards shown or redirected)` | `@regression @member` | Use `memberPage`, navigate to welcome, click support group → verify no pricing cards OR redirected to dashboard |

---

#### FILE 3-E: `specs/features/payment/stripe-payment.spec.ts`
**7 tests — Pattern: Isolated with `leaderPage` fixture**

**IMPORTANT:** For payment tests, navigate to the Group Activation payment page OR select Basic plan on pricing.
Use `GroupActivationPaymentPage` from `lib/pages/payment/GroupActivationPaymentPage.ts`.
Test card numbers from `APP_CONSTANTS.TEST_DATA.PAYMENT`.

Stripe test cards:
- Success: `4242424242424242`
- Declined: `4000000000000002`  → add to `APP_CONSTANTS` as `CARD_DECLINED`
- Expired: `4000000000000069`   → add to `APP_CONSTANTS` as `CARD_EXPIRED`
- Invalid CVC: `4000000000000127` → add to `APP_CONSTANTS` as `CARD_INVALID_CVC`

Add to `app-constants.ts` PAYMENT section:
```typescript
CARD_DECLINED: '4000000000000002',
CARD_EXPIRED: '4000000000000069',
CARD_INVALID_CVC: '4000000000000127',
```

| TC-PAY-01 | `Stripe iframe loads with all required fields visible` | `@smoke @critical @leader` | Activate payment flow, wait for iframe, verify card/expiry/CVC fields visible using `paymentPage.waitForVisible()` |
| TC-PAY-02 | `Pay button is disabled when Stripe form is empty` | `@regression @leader` | Load Stripe form, verify submit button is disabled before filling |
| TC-PAY-03 | `Valid Stripe test card completes payment successfully` | `@smoke @critical @leader` | Fill with `4242...` card, submit, verify success message matches `MESSAGES.PAYMENT.SUCCESS` |
| TC-PAY-04 | `Declined Stripe card shows error message` | `@regression @critical @leader` | Fill with `4000...0002`, submit, verify error text visible |
| TC-PAY-05 | `Expired Stripe card shows expiry error` | `@regression @leader` | Fill with expired card, verify error message |
| TC-PAY-06 | `Invalid CVC shows CVC error message` | `@regression @leader` | Fill valid card + invalid CVC, verify error |
| TC-PAY-07 | `Country dropdown selection updates form` | `@regression @leader` | Select different country in Stripe iframe, verify postal field updates |

---

#### FILE 3-F: `specs/features/group/group-create.spec.ts`
**5 tests — Pattern: Isolated with `leaderPage` fixture**

Use `GroupHelper.createGroup()` for the happy path.
Use `CreateGroupPage` from `lib/pages/group/CreateGroupPage.ts` for detail-level assertions.

| TC-GRP-01 | `Create new group with valid data shows success toast` | `@smoke @critical @leader` | Call `GroupHelper.createGroup(leaderPage, name)`, verify `MESSAGES.GROUPS.CREATED_SUCCESS` toast |
| TC-GRP-02 | `Group name field is required — error shown when empty` | `@regression @leader` | Navigate to create group page, try to submit without name, verify error |
| TC-GRP-03 | `Newly created group appears in leader group list` | `@smoke @leader` | Create group, navigate to My Groups, verify group name visible |
| TC-GRP-04 | `Member cannot access Group Create page` | `@regression @member` | Use `memberPage`, navigate to `/groups/new`, verify redirect or no create form |
| TC-GRP-05 | `Create group form has all required fields visible` | `@regression @leader` | Navigate to group create, verify name/description/schedule fields visible |

---

#### FILE 3-G: `specs/features/dashboard/dashboard.spec.ts`
**6 tests — Pattern: Isolated with `memberPage` + `leaderPage` fixtures**

Use `DashboardPage` from `lib/pages/dashboard/DashboardPage.ts`.

| TC-DSH-01 | `Member Dashboard: "Find a support group" button is visible` | `@smoke @member` | Use `memberPage`, navigate to dashboard, verify `UI_CONSTANTS.DASHBOARD.FIND_SUPPORT_GROUP_BUTTON` visible |
| TC-DSH-02 | `Member Dashboard: "Start a Group" link is NOT visible for member` | `@regression @member` | Use `memberPage`, navigate to dashboard, verify `UI_CONSTANTS.DASHBOARD.START_GROUP_LINK` not visible |
| TC-DSH-03 | `Member Dashboard: Can navigate to Profile page` | `@regression @member` | Use `memberPage`, call `NavigationHelper.gotoProfile()`, verify URL matches profile route |
| TC-DSH-04 | `Leader Dashboard: "Start a Group" link is visible for leader` | `@smoke @leader` | Use `leaderPage`, navigate to dashboard, verify start group link visible |
| TC-DSH-05 | `Leader Dashboard: Can navigate to My Groups` | `@smoke @leader` | Use `leaderPage`, call `NavigationHelper.gotoMyGroups()`, verify URL contains `/groups/my` |
| TC-DSH-06 | `Leader Dashboard: Search support groups input is accessible` | `@regression @leader` | Use `leaderPage`, navigate to dashboard, verify search placeholder visible |

---

#### FILE 3-H: `specs/features/flows/member-full-flow.spec.ts`
**5 tests — Pattern: `test.describe.serial` with shared context**

This is the COMPLETE Member journey: Register → OTP → Select Support Group → Onboard → Dashboard

```typescript
import { test, expect } from '../../../lib/fixtures/index';
import { RegistrationPage } from '../../../lib/pages/auth/RegistrationPage';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { MailinatorPage } from '../../../lib/pages/utils/MailinatorPage';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { NavigationHelper } from '../../../lib/helpers/NavigationHelper';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { URLS } from '../../../config/urls';
import { Logger } from '../../../lib/utils/Logger';

test.describe.serial('Member Full Flow: Register → OTP → Role Select → Onboard → Dashboard', () => {

    let context: any;
    let page: any;
    let email: string;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        test.setTimeout(300_000);
    });

    test.afterAll(async () => { await context.close(); });

    test('TC-MFL-01: Step 1 — Register new Member with valid data',
        { tag: ['@smoke', '@critical', '@member', '@e2e'] },
        async () => {
            // Step 1: Navigate to registration
            const registration = new RegistrationPage(page);
            await NavigationHelper.gotoRegistration(page);
            await expect(page).toHaveURL(new RegExp(URLS.REGISTER));

            // Step 2: Fill form with generated data
            email = DataGenerator.generateEmail();
            await registration.fillRegistrationForm({
                firstName: DataGenerator.firstName(),
                lastName: DataGenerator.lastName(),
                email,
                password: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT,
            });

            // Step 3: Submit form
            await registration.clickCreateAccount();

            // Step 4: Verify on OTP page
            await expect(page).toHaveURL(new RegExp(`${URLS.VERIFY_EMAIL}$`), { timeout: 20000 });
            Logger.success(`TC-MFL-01 ✅ Registered: ${email}`);
        });

    test('TC-MFL-02: Step 2 — Verify Email via OTP from Mailinator',
        { tag: ['@smoke', '@critical', '@member', '@e2e'] },
        async () => {
            // Step 1: Open Mailinator in new context tab
            const mailinatorTab = await context.newPage();
            const mailinator = new MailinatorPage(mailinatorTab);

            // Step 2: Retrieve OTP
            const otp = await mailinator.getOTPFromEmail(email);
            await mailinatorTab.close();

            // Step 3: Enter OTP
            const registration = new RegistrationPage(page);
            await registration.verifyEmailWithOTP(otp);

            // Step 4: Verify confirmation toast
            await AssertionHelper.verifyToastMessage(page, /email confirmed|confirmed/i);
            Logger.success('TC-MFL-02 ✅ OTP verified');
        });

    test('TC-MFL-03: Step 3 — Select "Support Group" role on Welcome screen',
        { tag: ['@smoke', '@critical', '@member', '@e2e'] },
        async () => {
            // Step 1: Verify on welcome page
            await expect(page).toHaveURL(new RegExp(URLS.WELCOME), { timeout: 15000 });

            // Step 2: Select member role
            const onboarding = new OnboardingPage(page);
            await onboarding.selectSupportGroupRole();
            Logger.success('TC-MFL-03 ✅ Member role selected');
        });

    test('TC-MFL-04: Step 4 — Complete Member Onboarding steps',
        { tag: ['@smoke', '@critical', '@member', '@e2e'] },
        async () => {
            const onboarding = new OnboardingPage(page);

            // Step 1–3: Skip 3 onboarding steps
            await onboarding.clickSkip();
            await onboarding.clickSkip();
            await onboarding.clickSkip();
            Logger.success('TC-MFL-04 ✅ Onboarding steps completed');
        });

    test('TC-MFL-05: Step 5 — Verify Member lands on Dashboard',
        { tag: ['@smoke', '@critical', '@member', '@e2e'] },
        async () => {
            // Verify correct dashboard URL and key UI element
            await AssertionHelper.verifyDashboardLoaded(page);
            Logger.success('TC-MFL-05 ✅ Member successfully on Dashboard');
        });
});
```

---

#### FILE 3-I: `specs/features/flows/leader-free-flow.spec.ts`
**6 tests — Pattern: `test.describe.serial` with shared context**

This is the COMPLETE Leader journey with **Free Plan** (no payment): Register → OTP → Select Group Leader → Onboard → Free Plan → Group Create

Write 6 serial tests following the EXACT same pattern as `member-full-flow.spec.ts`:

| TC-LFF-01 | `Step 1: Register new Leader` | `@smoke @critical @leader @e2e` | Same pattern as MFL-01 but for leader role |
| TC-LFF-02 | `Step 2: Verify OTP` | `@smoke @critical @leader @e2e` | Same pattern as MFL-02 |
| TC-LFF-03 | `Step 3: Select "Continue as Group Leader"` | `@smoke @critical @leader @e2e` | On /welcome, call `onboarding.selectGroupLeaderRole()` |
| TC-LFF-04 | `Step 4: Complete Leader Onboarding steps` | `@smoke @critical @leader @e2e` | Call `onboarding.clickContinue()` then `clickSkip()` × 3 |
| TC-LFF-05 | `Step 5: Pricing Module loads — Select Free Plan` | `@smoke @critical @leader @e2e` | Verify pricing plans visible. Click free plan. Verify NO Stripe form |
| TC-LFF-06 | `Step 6: Create Group after Free Plan selection` | `@smoke @critical @leader @e2e` | Use `GroupHelper.createGroup(page, groupName)`. Verify `MESSAGES.GROUPS.CREATED_SUCCESS` toast |

---

#### FILE 3-J: `specs/features/flows/leader-paid-flow.spec.ts`
**7 tests — Pattern: `test.describe.serial` with shared context**

This is the COMPLETE Leader journey with **Basic Paid Plan**: Register → OTP → Select Group Leader → Onboard → Basic Plan → Stripe Payment → Group Create

Write 7 serial tests following the EXACT same pattern:

| TC-LPF-01 | `Step 1: Register new Leader` | `@smoke @critical @leader @e2e` | Same as LFF-01 |
| TC-LPF-02 | `Step 2: Verify OTP` | `@smoke @critical @leader @e2e` | Same as LFF-02 |
| TC-LPF-03 | `Step 3: Select "Continue as Group Leader"` | `@smoke @critical @leader @e2e` | Same as LFF-03 |
| TC-LPF-04 | `Step 4: Complete Leader Onboarding steps` | `@smoke @critical @leader @e2e` | Same as LFF-04 |
| TC-LPF-05 | `Step 5: Pricing Module — Select Basic Plan` | `@smoke @critical @leader @e2e` | Click basic plan. Verify Stripe iframe appears via `paymentPage.waitForVisible()` |
| TC-LPF-06 | `Step 6: Complete Stripe Payment` | `@smoke @critical @leader @e2e` | Use `GroupActivationPaymentPage`: `fillPaymentDetails()` then `submitPayment()`. Verify `MESSAGES.PAYMENT.SUCCESS` |
| TC-LPF-07 | `Step 7: Create Group after Paid Plan activated` | `@smoke @critical @leader @e2e` | Use `GroupHelper.createGroup(page, groupName)`. Verify toast |

---

### ═══════════════════════════════════════════════
### BATCH 4: CONFIG UPDATES
### ═══════════════════════════════════════════════

#### FILE 4-A: `playwright.config.ts`
**ACTION: MODIFY** — Add dedicated `e2e-flows` project

Replace the `projects` block with:
```typescript
projects: [
    {
        name: 'setup-auth',
        testMatch: /.*\.setup\.ts/,
    },

    // Parallel-safe isolated tests (validation, UI checks, feature tests)
    {
        name: 'default',
        use: { ...DEFAULT_BROWSER },
        dependencies: ['setup-auth'],
        testIgnore: [/.*\.setup\.ts/, /specs\/features\/flows\/.*/],
        fullyParallel: true,
    },

    // Full E2E Serial Flows — NEVER run in parallel (shared browser state)
    {
        name: 'e2e-flows',
        use: { ...DEFAULT_BROWSER },
        dependencies: ['setup-auth'],
        testMatch: /specs\/features\/flows\/.*/,
        fullyParallel: false,
        workers: 1,
    },
],
```

---

## 📊 FINAL TEST COUNT PER FILE

After implementation, these are the expected counts:

| # | File Path | Tests | Status |
|---|---|---|---|
| 1 | `specs/features/auth/registration.spec.ts` | 10 | existing — verify count |
| 2 | `specs/features/onboarding/role-selection.spec.ts` | 5 | 🆕 new |
| 3 | `specs/features/onboarding/member-onboarding.spec.ts` | 4 | 🆕 new |
| 4 | `specs/features/onboarding/leader-onboarding.spec.ts` | 3 | 🆕 new |
| 5 | `specs/features/pricing/pricing-module.spec.ts` | 8 | 🆕 new |
| 6 | `specs/features/payment/stripe-payment.spec.ts` | 7 | 🆕 new |
| 7 | `specs/features/group/group-create.spec.ts` | 5 | 🆕 new |
| 8 | `specs/features/group/group-lifecycle.spec.ts` | 4 | existing — keep intact |
| 9 | `specs/features/dashboard/dashboard.spec.ts` | 6 | 🆕 new |
| 10 | `specs/features/flows/member-full-flow.spec.ts` | 5 | 🆕 new |
| 11 | `specs/features/flows/leader-free-flow.spec.ts` | 6 | 🆕 new |
| 12 | `specs/features/flows/leader-paid-flow.spec.ts` | 7 | 🆕 new |
| | **TOTAL** | **70** | |

---

## ✅ VERIFICATION CHECKLIST

After implementing all files, verify:

```bash
# 1. TypeScript compiles without errors
npx tsc --noEmit

# 2. All spec files are discovered (should show 70+ tests)
npx playwright test --list

# 3. Run just E2E flows (smoke only)
npx playwright test specs/features/flows/ --grep "@smoke" --project=e2e-flows

# 4. Run just isolated tests
npx playwright test --project=default --grep "@smoke"

# 5. Count tests by role
npx playwright test --list --grep "@member"
npx playwright test --list --grep "@leader"
```

---

## 🚫 WHAT YOU MUST NOT DO

1. ❌ Do NOT change `lib/fixtures/index.ts` — it re-exports correctly today
2. ❌ Do NOT rename `memberPage` or `leaderPage` fixtures — they are already wired to `storageState`
3. ❌ Do NOT use raw `@playwright/test` imports in spec files — always use `lib/fixtures/index`
4. ❌ Do NOT hardcode URLs — use `ROUTES`, `URLS`, or `ROUTE_PATHS`
5. ❌ Do NOT hardcode button text — use `UI_CONSTANTS`
6. ❌ Do NOT hardcode passwords or test data — use `APP_CONSTANTS`
7. ❌ Do NOT hardcode error messages — use `MESSAGES`
8. ❌ Do NOT break `group-lifecycle.spec.ts` — it works and must stay intact
9. ❌ Do NOT run parallel serial flows — `e2e-flows` project uses `workers: 1`
10. ❌ Do NOT skip Logger calls — every action needs `Logger.step()` and `Logger.success()`

---

## 📌 IMPORT PATH REFERENCE

From any file in `specs/features/[category]/`:
```typescript
import { test, expect } from '../../../lib/fixtures/index';
import { SomePage } from '../../../lib/pages/[folder]/SomePage';
import { SomeHelper } from '../../../lib/helpers/SomeHelper';
import { DataGenerator } from '../../../lib/utils/DataGenerator';
import { AssertionHelper } from '../../../lib/helpers/AssertionHelper';
import { NavigationHelper } from '../../../lib/helpers/NavigationHelper';
import { APP_CONSTANTS } from '../../../lib/data/constants/app-constants';
import { MESSAGES } from '../../../lib/data/constants/messages';
import { UI_CONSTANTS } from '../../../lib/data/constants/ui-constants';
import { URLS, ROUTES, ROUTE_PATHS } from '../../../config/urls';
import { Logger } from '../../../lib/utils/Logger';
import { RuntimeStore } from '../../../lib/utils/RuntimeStore';
```

From `specs/features/flows/`:
```typescript
import { test, expect } from '../../../lib/fixtures/index';  // same depth
```

---

## 🎯 SUCCESS CRITERIA

✅ `npx tsc --noEmit` → **0 errors**
✅ `npx playwright test --list` → shows **exactly 70 tests** (plus existing auth/login/logout/forgot-password tests)
✅ No existing test files are modified **except** `registration.spec.ts` to verify count
✅ `OnboardingPage.ts` has `selectSupportGroupRole()` and `completeMemberOnboardingFlow()`
✅ `ui-constants.ts` has `SUPPORT_GROUP: 'support group'` in ONBOARDING section
✅ `playwright.config.ts` has both `default` and `e2e-flows` projects
✅ All 3 E2E flow files are in `specs/features/flows/` folder
✅ All spec files use `@member` or `@leader` role tags appropriately
