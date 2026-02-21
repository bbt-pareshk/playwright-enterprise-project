# Flow-Based Test Plan: Member & Leader Journeys
> **Framework:** Playwright Enterprise Framework (TypeScript · Playwright)
> **Date:** 2026-02-21 | **Version:** 2.0 (Role-Selection Aware)
> **Total Final Test Cases: 66**

---

## 🔑 Critical Insight — The Role Selection Screen

After OTP Verification, the user lands on `/welcome` (Onboarding screen).
**This screen presents TWO role-selection buttons** that determine the entire subsequent journey:

```
┌─────────────────────────────────────────────────────────────┐
│                  Welcome! What brings you here?             │
│                                                             │
│  [ Continue as a Group Leader ]   [ Support Group ]         │
└─────────────────────────────────────────────────────────────┘
        │                                    │
        ▼                                    ▼
  LEADER PATH                          MEMBER PATH
  ─────────────                        ─────────────
  Continue → Skip × 3                  Skip × 3 (or Continue)
        │                                    │
        ▼                                    ▼
  Pricing Module                         Dashboard
  (Free/Basic/Premium)
        │
        ▼
  Payment (Stripe) — only for paid plans
        │
        ▼
  Group Create
```

This single screen is the **divergence point** for all flows.
The `OnboardingPage.ts` needs a `selectSupportGroupRole()` method to handle the member path.

---

## 🗺️ Full Journey Map

```
SHARED (both roles):
  1. Register  →  2. OTP Verify  →  3. Welcome Screen (Role Selection)
                                              │
                ┌─────────────────────────────┴──────────────────────────────┐
                │                                                             │
        [ Continue as Group Leader ]                               [ Support Group ]
                │                                                             │
        4. Leader Onboarding Steps                           4. Member Onboarding Steps
                │                                                             │
        5. Pricing Module                                       5. Dashboard ✅
       (Free / Basic / Premium)
                │
         ┌──────┴──────────┐
         │                 │
      Free Plan       Basic / Premium
         │                 │
    5a. Group Create   5b. Stripe Payment
         ✅                  │
                       6. Group Create ✅
```

---

## 📁 Final File Structure

```
specs/
└── features/
    ├── auth/
    │   ├── registration.spec.ts          ✅ EXISTS — extend with OTP tests
    │   ├── login.spec.ts                 ✅ EXISTS
    │   ├── logout.spec.ts                ✅ EXISTS
    │   └── forgot-password.spec.ts       ✅ EXISTS
    │
    ├── onboarding/
    │   ├── role-selection.spec.ts        🆕 NEW — role screen tests (both buttons)
    │   ├── member-onboarding.spec.ts     🆕 NEW — Support Group path
    │   └── leader-onboarding.spec.ts    🆕 NEW — Group Leader path
    │
    ├── pricing/
    │   └── pricing-module.spec.ts        🆕 NEW — Free/Basic/Premium plan tests
    │
    ├── payment/
    │   └── stripe-payment.spec.ts        🆕 NEW — Stripe iframe tests
    │
    ├── group/
    │   ├── group-create.spec.ts          🆕 NEW — isolated group creation tests
    │   └── group-lifecycle.spec.ts       ✅ EXISTS — 4-step lifecycle
    │
    ├── dashboard/
    │   └── dashboard.spec.ts             🆕 NEW — member & leader dashboard checks
    │
    └── flows/                            🆕 NEW FOLDER — full E2E serial flows
        ├── member-full-flow.spec.ts      Member:  Register→OTP→SupportGroup→Onboard→Dashboard
        ├── leader-free-flow.spec.ts      Leader (Free):  Register→OTP→Leader→Onboard→FreePlan→GroupCreate
        └── leader-paid-flow.spec.ts      Leader (Paid):  Register→OTP→Leader→Onboard→BasicPlan→Pay→GroupCreate
```

---

## ⚙️ Page Object Changes Required

### `OnboardingPage.ts` — Add Member Role Support

The page currently only has `continueAsLeaderButton`.
We need to add:

```typescript
// NEW locator to add
private readonly continueAsSupportGroupButton: Locator;

constructor(page: Page) {
  // existing...
  this.continueAsLeaderButton = page.getByRole('button', {
    name: new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.CONTINUE_AS_LEADER, 'i')
  });

  // NEW — for member path
  this.continueAsSupportGroupButton = page.getByRole('button', {
    name: new RegExp(UI_CONSTANTS.AUTH.ONBOARDING.SUPPORT_GROUP, 'i')
  });
}

// NEW method
async selectSupportGroupRole(): Promise<void> {
  Logger.step('Selecting Support Group role (Member path)');
  await this.continueAsSupportGroupButton.waitFor({ state: 'visible', timeout: 10000 });
  await this.click(this.continueAsSupportGroupButton);
  Logger.success('Support Group role selected');
}

// NEW method — complete member onboarding flow
async completeMemberOnboardingFlow(): Promise<void> {
  await this.selectSupportGroupRole();
  await this.clickSkip();
  await this.clickSkip();
  await this.clickSkip();
}
```

### `ui-constants.ts` — Add Missing Constant

```typescript
ONBOARDING: {
  CONTINUE_AS_LEADER: 'continue as a group leader',  // ✅ exists
  SUPPORT_GROUP: 'support group',                    // 🆕 ADD
  CONTINUE: 'continue',                              // ✅ exists
  SKIP: 'skip',                                      // ✅ exists
},
```

---

## 📋 All 66 Test Cases — Final Master List

---

### 📂 SECTION 1: Registration & OTP
**File:** `specs/features/auth/registration.spec.ts`
**Pattern:** Serial (TC-REG-01/02) + Isolated (TC-REG-03 to TC-REG-10)

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-REG-01 | Register with valid data → redirects to OTP page | Both | `@smoke @critical` | P0 |
| TC-REG-02 | OTP Email Verification with correct code | Both | `@smoke @critical` | P0 |
| TC-REG-03 | Resend OTP → new code delivered → verify succeeds | Both | `@smoke @critical` | P0 |
| TC-REG-04 | Required fields validation (First/Last Name empty) | Both | `@regression @smoke` | P1 |
| TC-REG-05 | First name rejects numbers (e.g., `John123`) | Both | `@regression` | P1 |
| TC-REG-06 | Last name rejects special characters (e.g., `Doe!`) | Both | `@regression` | P1 |
| TC-REG-07 | Short password → Create button disabled | Both | `@regression` | P1 |
| TC-REG-08 | Long password → handled per app behavior | Both | `@regression` | P2 |
| TC-REG-09 | Duplicate email → inline "not available" error | Both | `@smoke @critical` | P0 |
| TC-REG-10 | Password visibility toggle (eye icon) | Both | `@regression @optional` | P2 |

**Section Subtotal: 10 tests**

---

### 📂 SECTION 2: Role Selection (Onboarding Screen)
**File:** `specs/features/onboarding/role-selection.spec.ts`
**Pattern:** Isolated (`leaderPage` / fresh page)
**Precondition:** User is on `/welcome` → just verified OTP

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-ROLE-01 | Welcome screen loads after OTP verification | Both | `@smoke @critical` | P0 |
| TC-ROLE-02 | "Continue as Group Leader" button is visible | Both | `@smoke` | P1 |
| TC-ROLE-03 | "Support Group" button is visible | Both | `@smoke` | P1 |
| TC-ROLE-04 | Selecting "Continue as Group Leader" → navigates to Leader onboarding steps | Leader | `@smoke @critical` | P0 |
| TC-ROLE-05 | Selecting "Support Group" → navigates to Member onboarding steps | Member | `@smoke @critical` | P0 |

**Section Subtotal: 5 tests**

---

### 📂 SECTION 3: Member Onboarding
**File:** `specs/features/onboarding/member-onboarding.spec.ts`
**Pattern:** Isolated — `memberPage` fixture (already authenticated new user)
**Precondition:** User selected "Support Group" role

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-MOB-01 | Member: Onboarding step 1 is shown after role selection | Member | `@smoke` | P1 |
| TC-MOB-02 | Member: Skip button navigates to next step | Member | `@regression` | P1 |
| TC-MOB-03 | Member: Completing all skip steps redirects to Dashboard | Member | `@smoke @critical` | P0 |
| TC-MOB-04 | Member: Does NOT see "Continue as Group Leader" flow | Member | `@regression` | P1 |

**Section Subtotal: 4 tests**

---

### 📂 SECTION 4: Leader Onboarding
**File:** `specs/features/onboarding/leader-onboarding.spec.ts`
**Pattern:** Isolated — `leaderPage` fixture
**Precondition:** User selected "Continue as Group Leader" role

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-LOB-01 | Leader: Leader onboarding step is shown after role selection | Leader | `@smoke @critical` | P0 |
| TC-LOB-02 | Leader: Continue button moves to next onboarding step | Leader | `@regression` | P1 |
| TC-LOB-03 | Leader: Completing all steps redirects to Pricing Module | Leader | `@smoke @critical` | P0 |

**Section Subtotal: 3 tests**

---

### 📂 SECTION 5: Pricing Module
**File:** `specs/features/pricing/pricing-module.spec.ts`
**Pattern:** Isolated — `leaderPage` fixture (navigate to pricing URL)
**Precondition:** Authenticated as Leader, on Pricing page

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-PRC-01 | Pricing page loads with 3 plan cards visible | Leader | `@smoke @critical` | P0 |
| TC-PRC-02 | Free plan card: name, features, and CTA button visible | Leader | `@smoke` | P1 |
| TC-PRC-03 | Basic plan card: name, price, features, CTA button visible | Leader | `@smoke` | P1 |
| TC-PRC-04 | Premium plan card: name, price, features, CTA button visible | Leader | `@smoke` | P1 |
| TC-PRC-05 | Selecting Free Plan does NOT show Stripe payment form | Leader | `@regression @critical` | P0 |
| TC-PRC-06 | Selecting Basic Plan opens Stripe payment form | Leader | `@regression @critical` | P0 |
| TC-PRC-07 | Selecting Premium Plan opens Stripe payment form | Leader | `@regression @critical` | P0 |
| TC-PRC-08 | Member role cannot access Pricing Module (redirect/403) | Member | `@regression` | P1 |

**Section Subtotal: 8 tests**

---

### 📂 SECTION 6: Stripe Payment
**File:** `specs/features/payment/stripe-payment.spec.ts`
**Pattern:** Isolated — `leaderPage` fixture (navigate via Basic/Premium plan selection)
**Precondition:** Authenticated as Leader, Stripe iframe is visible on screen

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-PAY-01 | Stripe iframe loads with all fields (card, expiry, CVC, country) | Leader | `@smoke @critical` | P0 |
| TC-PAY-02 | Pay button is disabled when form is empty | Leader | `@regression` | P1 |
| TC-PAY-03 | Submit with Stripe test card `4242...` → payment success | Leader | `@smoke @critical` | P0 |
| TC-PAY-04 | Submit with declined card `4000...0002` → error shown | Leader | `@regression @critical` | P0 |
| TC-PAY-05 | Submit with expired card → expiry error shown | Leader | `@regression` | P1 |
| TC-PAY-06 | Submit with invalid CVC → CVC error shown | Leader | `@regression` | P1 |
| TC-PAY-07 | Country dropdown is selectable and updates postal code field | Leader | `@regression` | P2 |

**Section Subtotal: 7 tests**

---

### 📂 SECTION 7: Group Create
**File:** `specs/features/group/group-create.spec.ts`
**Pattern:** Isolated — `leaderPage` fixture
**Precondition:** Leader is authenticated and has an activated plan

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-GRP-01 | Create new group with valid name → success toast | Leader | `@smoke @critical` | P0 |
| TC-GRP-02 | Group name field is required → error shown if empty | Leader | `@regression` | P1 |
| TC-GRP-03 | Duplicate group name → inline error shown | Leader | `@regression` | P1 |
| TC-GRP-04 | Newly created group appears in leader's group list | Leader | `@smoke` | P1 |
| TC-GRP-05 | Member role cannot access Group Create page | Member | `@regression` | P1 |

**Section Subtotal: 5 tests**

---

### 📂 SECTION 8: Group Lifecycle (Existing — Verified)
**File:** `specs/features/group/group-lifecycle.spec.ts`
**Pattern:** `test.describe.serial` — `leaderPage` fixture
**Status:** ✅ Already implemented — verify & keep

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-GLC-01 | Step 1: Create Group | Leader | `@smoke @critical` | P0 |
| TC-GLC-02 | Step 2: Activate Group (Payment via Stripe) | Leader | `@smoke @critical` | P0 |
| TC-GLC-03 | Step 3: Configure Group Membership settings | Leader | `@smoke @critical` | P0 |
| TC-GLC-04 | Step 4: Create Session inside Group | Leader | `@smoke @critical` | P0 |

**Section Subtotal: 4 tests**

---

### 📂 SECTION 9: Dashboard
**File:** `specs/features/dashboard/dashboard.spec.ts`
**Pattern:** Isolated — `memberPage` + `leaderPage` fixtures

| ID | Test Case Name | Flow | Tag | Priority |
|---|---|---|---|---|
| TC-DSH-01 | Member Dashboard: "Find a support group" button is visible | Member | `@smoke` | P1 |
| TC-DSH-02 | Member Dashboard: "Start a Group" link is NOT visible/accessible | Member | `@regression` | P1 |
| TC-DSH-03 | Member Dashboard: Can navigate to Profile page | Member | `@regression` | P1 |
| TC-DSH-04 | Leader Dashboard: "Start a Group" option is visible | Leader | `@smoke` | P1 |
| TC-DSH-05 | Leader Dashboard: Can navigate to My Groups | Leader | `@smoke` | P1 |
| TC-DSH-06 | Leader Dashboard: Can navigate to Profile page | Leader | `@regression` | P2 |

**Section Subtotal: 6 tests**

---

### 📂 SECTION 10: Member Full E2E Flow (Serial)
**File:** `specs/features/flows/member-full-flow.spec.ts`
**Pattern:** `test.describe.serial` — shared browser context, 1 new user created per run
**State:** `email` passed between steps via `let` variable

| ID | Test Step Name | Tag | Priority |
|---|---|---|---|
| TC-MFL-01 | Step 1: Register new Member with fresh email | `@smoke @critical @member` | P0 |
| TC-MFL-02 | Step 2: Verify email via OTP from Mailinator | `@smoke @critical @member` | P0 |
| TC-MFL-03 | Step 3: Select "Support Group" on Role Selection screen | `@smoke @critical @member` | P0 |
| TC-MFL-04 | Step 4: Complete Member onboarding steps (skip) | `@smoke @critical @member` | P0 |
| TC-MFL-05 | Step 5: Verify Dashboard loads for Member | `@smoke @critical @member` | P0 |

**Section Subtotal: 5 tests**

---

### 📂 SECTION 11: Leader Full E2E Flow — Free Plan (Serial)
**File:** `specs/features/flows/leader-free-flow.spec.ts`
**Pattern:** `test.describe.serial` — shared browser context

| ID | Test Step Name | Tag | Priority |
|---|---|---|---|
| TC-LFF-01 | Step 1: Register new Leader with fresh email | `@smoke @critical @leader` | P0 |
| TC-LFF-02 | Step 2: Verify email via OTP from Mailinator | `@smoke @critical @leader` | P0 |
| TC-LFF-03 | Step 3: Select "Continue as Group Leader" on Role Screen | `@smoke @critical @leader` | P0 |
| TC-LFF-04 | Step 4: Complete Leader onboarding steps | `@smoke @critical @leader` | P0 |
| TC-LFF-05 | Step 5: Pricing Module shown → Select Free Plan | `@smoke @critical @leader` | P0 |
| TC-LFF-06 | Step 6: Create Group (Free plan — no payment required) | `@smoke @critical @leader` | P0 |

**Section Subtotal: 6 tests**

---

### 📂 SECTION 12: Leader Full E2E Flow — Paid Plan (Serial)
**File:** `specs/features/flows/leader-paid-flow.spec.ts`
**Pattern:** `test.describe.serial` — shared browser context

| ID | Test Step Name | Tag | Priority |
|---|---|---|---|
| TC-LPF-01 | Step 1: Register new Leader with fresh email | `@smoke @critical @leader` | P0 |
| TC-LPF-02 | Step 2: Verify email via OTP from Mailinator | `@smoke @critical @leader` | P0 |
| TC-LPF-03 | Step 3: Select "Continue as Group Leader" on Role Screen | `@smoke @critical @leader` | P0 |
| TC-LPF-04 | Step 4: Complete Leader onboarding steps | `@smoke @critical @leader` | P0 |
| TC-LPF-05 | Step 5: Pricing Module shown → Select Basic/Premium Plan | `@smoke @critical @leader` | P0 |
| TC-LPF-06 | Step 6: Complete Stripe Payment with test card `4242...` | `@smoke @critical @leader` | P0 |
| TC-LPF-07 | Step 7: Create Group (paid plan activated) | `@smoke @critical @leader` | P0 |

**Section Subtotal: 7 tests**

---

## 📊 Final Test Count Summary

| # | Section | File | Tests | Status |
|---|---|---|---|---|
| 1 | Registration & OTP | `auth/registration.spec.ts` | **10** | ✅ Extend existing |
| 2 | Role Selection (Onboarding) | `onboarding/role-selection.spec.ts` | **5** | 🆕 New |
| 3 | Member Onboarding | `onboarding/member-onboarding.spec.ts` | **4** | 🆕 New |
| 4 | Leader Onboarding | `onboarding/leader-onboarding.spec.ts` | **3** | 🆕 New |
| 5 | Pricing Module | `pricing/pricing-module.spec.ts` | **8** | 🆕 New |
| 6 | Stripe Payment | `payment/stripe-payment.spec.ts` | **7** | 🆕 New |
| 7 | Group Create | `group/group-create.spec.ts` | **5** | 🆕 New |
| 8 | Group Lifecycle | `group/group-lifecycle.spec.ts` | **4** | ✅ Existing |
| 9 | Dashboard | `dashboard/dashboard.spec.ts` | **6** | 🆕 New |
| 10 | Member E2E Full Flow | `flows/member-full-flow.spec.ts` | **5** | 🆕 New |
| 11 | Leader E2E Flow (Free Plan) | `flows/leader-free-flow.spec.ts` | **6** | 🆕 New |
| 12 | Leader E2E Flow (Paid Plan) | `flows/leader-paid-flow.spec.ts` | **7** | 🆕 New |
| | | **TOTAL** | **70** | |

> **Note:** Login, Logout, and ForgotPassword specs (existing) add ~12 more tests = **~82 tests** in full suite.

---

## 🏷️ Tag Execution Matrix

| Command | Tests Run | Count (approx) |
|---|---|---|
| `--grep "@smoke"` | Critical path only | ~30 |
| `--grep "@regression"` | Full validation suite | ~40 |
| `--grep "@critical"` | P0 tests only | ~25 |
| `--grep "@member"` | All member-path tests | ~15 |
| `--grep "@leader"` | All leader-path tests | ~25 |
| `--grep "@smoke AND @member"` | Member smoke only | ~8 |
| `--grep "@smoke AND @leader"` | Leader smoke only | ~15 |
| No filter | Entire suite | **~82** |

---

## 🏗️ Implementation Strategy — Standard Code Pattern

### Pattern A: Full E2E Serial Flow (Flows folder)

```typescript
// specs/features/flows/member-full-flow.spec.ts
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

    test.afterAll(async () => await context.close());

    // ─── STEP 1 ───────────────────────────────────────────────────────────
    test('Step 1: Register new Member',
        { tag: ['@smoke', '@critical', '@member'] },
        async () => {
            const registration = new RegistrationPage(page);
            await NavigationHelper.gotoRegistration(page);
            email = DataGenerator.generateEmail();
            await registration.fillRegistrationForm({
                firstName: DataGenerator.firstName(),
                lastName: DataGenerator.lastName(),
                email,
                password: APP_CONSTANTS.TEST_DATA.PASSWORD_TEST.DEFAULT,
            });
            await registration.clickCreateAccount();
            await expect(page).toHaveURL(new RegExp(`${URLS.VERIFY_EMAIL}$`), { timeout: 20000 });
            Logger.success(`Step 1 ✅ — Registered: ${email}`);
        });

    // ─── STEP 2 ───────────────────────────────────────────────────────────
    test('Step 2: Verify OTP from Mailinator',
        { tag: ['@smoke', '@critical', '@member'] },
        async () => {
            const registration = new RegistrationPage(page);
            const mailinatorTab = await context.newPage();
            const mailinator = new MailinatorPage(mailinatorTab);
            const otp = await mailinator.getOTPFromEmail(email);
            await mailinatorTab.close();
            await registration.verifyEmailWithOTP(otp);
            await AssertionHelper.verifyToastMessage(page, /confirmed|verified/i);
            Logger.success('Step 2 ✅ — OTP verified');
        });

    // ─── STEP 3 ───────────────────────────────────────────────────────────
    test('Step 3: Select "Support Group" role on Welcome screen',
        { tag: ['@smoke', '@critical', '@member'] },
        async () => {
            const onboarding = new OnboardingPage(page);
            await expect(page).toHaveURL(new RegExp(URLS.WELCOME), { timeout: 15000 });
            await onboarding.selectSupportGroupRole();           // 🆕 new method
            Logger.success('Step 3 ✅ — Member role selected');
        });

    // ─── STEP 4 ───────────────────────────────────────────────────────────
    test('Step 4: Complete Member Onboarding steps',
        { tag: ['@smoke', '@critical', '@member'] },
        async () => {
            const onboarding = new OnboardingPage(page);
            await onboarding.clickSkip();
            await onboarding.clickSkip();
            await onboarding.clickSkip();
            Logger.success('Step 4 ✅ — Onboarding steps skipped');
        });

    // ─── STEP 5 ───────────────────────────────────────────────────────────
    test('Step 5: Dashboard loads for Member',
        { tag: ['@smoke', '@critical', '@member'] },
        async () => {
            await AssertionHelper.verifyDashboardLoaded(page);
            Logger.success('Step 5 ✅ — Member on Dashboard');
        });
});
```

---

### Pattern B: Isolated Validation Tests (Pricing, Payment, Group)

```typescript
// specs/features/pricing/pricing-module.spec.ts
import { test, expect } from '../../../lib/fixtures/index';
import { PricingPage } from '../../../lib/pages/pricing/PricingPage';  // 🆕 New PO

test.describe('Pricing Module', () => {

    test('TC-PRC-01: Pricing page shows 3 plan cards',
        { tag: ['@smoke', '@critical', '@leader'] },
        async ({ leaderPage }) => {
            const pricing = new PricingPage(leaderPage);
            await pricing.goto();
            await pricing.verifyAllPlansVisible();
        });

    test('TC-PRC-05: Free Plan does not trigger Stripe payment',
        { tag: ['@regression', '@critical', '@leader'] },
        async ({ leaderPage }) => {
            const pricing = new PricingPage(leaderPage);
            await pricing.goto();
            await pricing.selectFreePlan();
            await pricing.verifyStripeFormNotVisible();
        });

    test('TC-PRC-06: Basic Plan opens Stripe payment form',
        { tag: ['@regression', '@critical', '@leader'] },
        async ({ leaderPage }) => {
            const pricing = new PricingPage(leaderPage);
            await pricing.goto();
            await pricing.selectBasicPlan();
            await pricing.verifyStripeFormVisible();
        });
});
```

---

### Pattern C: Role Selection Isolation Test

```typescript
// specs/features/onboarding/role-selection.spec.ts
import { test, expect } from '../../../lib/fixtures/index';
import { OnboardingPage } from '../../../lib/pages/auth/OnboardingPage';
import { URLS } from '../../../config/urls';

// Note: These tests run against the /welcome page using a pre-registered
// but not-yet-onboarded user. A test-specific setup creates the user.
test.describe('Onboarding - Role Selection Screen', () => {

    test('TC-ROLE-02: "Continue as Group Leader" button is visible',
        { tag: ['@smoke', '@leader'] },
        async ({ page }) => {
            const onboarding = new OnboardingPage(page);
            await page.goto(URLS.WELCOME);
            await expect(onboarding.continueAsLeaderButton).toBeVisible();
        });

    test('TC-ROLE-03: "Support Group" button is visible',
        { tag: ['@smoke', '@member'] },
        async ({ page }) => {
            const onboarding = new OnboardingPage(page);
            await page.goto(URLS.WELCOME);
            await expect(onboarding.continueAsSupportGroupButton).toBeVisible();
        });
});
```

---

## 🔢 How Test Counts Appear in Reports

### Terminal (runtime — `list` reporter)
```
  ✓  TC-MFL-01 Step 1: Register new Member            (4s)
  ✓  TC-MFL-02 Step 2: Verify OTP from Mailinator     (12s)
  ✓  TC-MFL-03 Step 3: Select "Support Group" role    (2s)
  ✓  TC-MFL-04 Step 4: Complete Member Onboarding     (3s)
  ✓  TC-MFL-05 Step 5: Dashboard loads for Member     (3s)

  5 passed, 0 failed (24s)
```

### HTML Report (opens in browser)
```
Total: 70   Passed: 68   Failed: 1   Skipped: 1
  └── Registration & OTP ............... 10/10
  └── Role Selection ................... 5/5
  └── Member Onboarding ................ 4/4
  └── Leader Onboarding ................ 3/3
  └── Pricing Module ................... 8/8
  └── Stripe Payment ................... 7/7
  └── Group Create ..................... 5/5
  └── Group Lifecycle .................. 4/4
  └── Dashboard ........................ 6/6
  └── Member E2E Flow .................. 5/5
  └── Leader E2E Free Flow ............. 6/6
  └── Leader E2E Paid Flow ............. 7/7
```

### JUnit XML (for CI badge / GitHub Actions)
```xml
<testsuites tests="70" failures="0" errors="0" time="342.5">
  <testsuite name="Registration &amp; OTP" tests="10" failures="0" />
  <testsuite name="Member Full Flow" tests="5" failures="0" />
  <testsuite name="Leader E2E Paid Flow" tests="7" failures="0" />
</testsuites>
```

---

## 🚀 Implementation Phases

### Phase 1 — Update Existing Code (Day 1)
- [ ] Add `SUPPORT_GROUP` to `ui-constants.ts`
- [ ] Add `selectSupportGroupRole()` + `completeMemberOnboardingFlow()` to `OnboardingPage.ts`
- [ ] Expose `continueAsSupportGroupButton` as `readonly` for assertions in tests

### Phase 2 — New Page Objects (Day 1)
- [ ] `lib/pages/pricing/PricingPage.ts`
  - `goto()`, `selectFreePlan()`, `selectBasicPlan()`, `selectPremiumPlan()`
  - `verifyAllPlansVisible()`, `verifyStripeFormVisible()`, `verifyStripeFormNotVisible()`

### Phase 3 — New Spec Files (Day 2–3)
Create in this order (dependency-safe):
1. `specs/features/onboarding/role-selection.spec.ts`
2. `specs/features/onboarding/member-onboarding.spec.ts`
3. `specs/features/onboarding/leader-onboarding.spec.ts`
4. `specs/features/pricing/pricing-module.spec.ts`
5. `specs/features/payment/stripe-payment.spec.ts`
6. `specs/features/group/group-create.spec.ts`
7. `specs/features/dashboard/dashboard.spec.ts`
8. `specs/features/flows/member-full-flow.spec.ts`
9. `specs/features/flows/leader-free-flow.spec.ts`
10. `specs/features/flows/leader-paid-flow.spec.ts`

### Phase 4 — playwright.config.ts Update (Day 3)
```typescript
projects: [
  { name: 'setup-auth', testMatch: /.*\.setup\.ts/ },

  // Parallel-safe isolated tests
  {
    name: 'default',
    use: { ...DEFAULT_BROWSER },
    dependencies: ['setup-auth'],
    testIgnore: [/.*\.setup\.ts/, /flows\/.*/],
    fullyParallel: true,
    workers: 4,
  },

  // E2E serial flows — NEVER parallelize (shared state between steps)
  {
    name: 'e2e-flows',
    use: { ...DEFAULT_BROWSER },
    dependencies: ['setup-auth'],
    testMatch: /specs\/features\/flows\/.*/,
    fullyParallel: false,
    workers: 1,              // Each flow file runs its steps in order
  },
],
```

### Phase 5 — Verify Count in CI (Day 3)
```yaml
# .github/workflows/playwright-ci.yml (add after test run)
- name: Print Test Summary
  run: |
    node -e "
      const r = require('./test-results/results.json');
      console.log('');
      console.log('╔══════════════════════════════╗');
      console.log('║       TEST SUITE SUMMARY     ║');
      console.log('╠══════════════════════════════╣');
      console.log('║  Total:   ' + String(r.stats.total).padEnd(19) + '║');
      console.log('║  Passed:  ' + String(r.stats.expected).padEnd(19) + '║');
      console.log('║  Failed:  ' + String(r.stats.unexpected).padEnd(19) + '║');
      console.log('║  Skipped: ' + String(r.stats.skipped).padEnd(19) + '║');
      console.log('╚══════════════════════════════╝');
    "
```

---

## ⚡ Quick Reference — Which Pattern for What

| Scenario | Pattern | Framework API |
|---|---|---|
| Complete flow test (Register → Dashboard) | `test.describe.serial` + shared `context` | `beforeAll` / `afterAll` |
| UI validation (form errors, button state) | `test.describe` + fresh page | Fixture `{ page }` |
| Authenticated member actions | `test.describe` + member auth | Fixture `{ memberPage }` |
| Authenticated leader actions | `test.describe` + leader auth | Fixture `{ leaderPage }` |
| Either role navigation check | Pass correct fixture per `test` | `memberPage` or `leaderPage` |
