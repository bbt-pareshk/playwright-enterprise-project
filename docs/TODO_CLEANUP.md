# 🧹 Cleanup & Refactoring Roadmap

To preserve the elite posture of the Playwright Enterprise Framework, the following files and legacy patterns are scheduled for deletion or full refactoring.

## 1. High Priority Deletions (Dead Code)

| File / Component | Status | Reason |
| :--- | :--- | :--- |
| **`specs/features/group/group-lifecycle.spec.ts`** | ❌ **DEAD** | Completely ignored via `IGNORE_FILE_COMPLETELY` flag. Replaced by Lifecycle V2. |
| **`specs/features/auth/registration-OLD.spec.ts`** | ⚠️ **LEGACY** | (If any old versions exist) All auth logic is now in `registration.spec.ts`. |

---

## 2. Low Priority Refactoring (Technical Debt)

### **Legacy Method Migration**
*   **`GroupHelper.createGroup()`**: This method currently handles all wizard tabs in one giant block. 
    *   **Action**: New tests must use **`GroupFlow.ts`** (atomic tab methods). Deprecate the helper once all old flows are migrated.
*   **`SessionHelper.ts`**: Similar to above. Migration toward **`SessionFlow.ts`** is recommended for better session date/tag handling.

### **Tag Standarization**
*   **Integrated Tests**: Ensure no `@regression` tags exist inside `@smoke` serial blocks to prevent worker state breakage during isolated runs. Done for `group-lifecycle-v2.spec.ts`.

---

## 3. Environment Dependencies
*   **Missing Credentials**: The `group-plan-limits.spec.ts` is currently auto-skipping because `LEADER_ACTIVE_HOSTING_PLAN_USERNAME` is missing from `.env`. 
    *   **Action**: Populate the pre-seeded account data to enable these 2 critical tests.

---
*Tracked by Antigravity AI Architecture Team.*
