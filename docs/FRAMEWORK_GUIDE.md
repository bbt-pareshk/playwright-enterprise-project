# 📘 Framework Master Guide - Playwright Enterprise

**Last Updated:** March 19, 2026  
**Status:** ✅ Highly Optimized | **Tests:** 94+ Total | **Stability:** 100% (Session Protection Active)

---

## 🏗️ Architecture Overview

The framework follows a multi-layered Enterprise Page Object Model (POM) with a focused **Flow Orchestration layer** for high-speed E2E.

- **`config/`**: Centralized environment configuration (URL/Env/Flags).
- **`lib/pages/`**: Single-page atomic objects containing locators and basic actions.
- **`lib/flows/`**: (NEW) Atomic orchestration for multi-stage journeys (e.g., `GroupFlow`, `SessionFlow`).
- **`lib/helpers/`**: High-level persona-specific services spanning multiple pages.
- **`lib/utils/`**: Technical utilities (Logger, Data Generator, Verification Services).
- **`lib/data/`**: Static constants (Messages, Roles, UI Labels) to prevent hardcoding.
- **`specs/`**: Clean test suites focusing on business intent and granular step reporting.

---

## 🛠️ TypeScript & Environment Configuration

- **Type Definitions**: `@types/node` provides full support for global objects like `process`.
- **Environment Validation**: `config/env.ts` performs early, strict validation of `.env` variables.
- **CI Enforcement**: `isCI` is forced to `true` in config to ensure headless execution and strict state resets.

---

## 🚀 Execution & Reporting

### Primary Commands
| Command | Purpose |
|---------|---------|
| `npx playwright test --grep "@smoke"` | Run critical path scenarios |
| `npx playwright test --project=group-v2` | Run the Integrated Group & Session Lifecycle |
| `npx playwright test --list` | List all discovered tests and locations |
| `npm run allure:report` | Generate and open Allure visual report |

---

## ⚡ Key Enterprise Features

### 1. Integrated Lifecycle V2
We have moved away from slow, repetitive registration-based tests towards **State-Based Journeys**. 
*   **Storage Reuse**: The `group-v2` suite reuses `leader_functional.json` to skip registration and payment.
*   **Integrated Path**: A single vertical flow now covers Group Creation → Session Scheduling in ~80 seconds.

### 2. Anonymous Session Protection (Lifetime Fix)
To prevent "Smart Redirects" to the dashboard during Auth tests (Login/Register/Reset), we use **`AuthHelper.forceLogout(page)`**.
*   **Mechanism**: Aggressively clears all Browser Storage and Cookies before sensitive navigations.
*   **Result**: 100% stability for Registration Integrity and Password Visibility tests.

### 3. OTP Bypass Mechanism (Staging Only)
*   **Toggle**: `USE_OTP_BYPASS=true` in `.env`.
*   **Verification**: Automatically uses fixed code `456321`.

---

## 🔧 Maintenance & Best Practices

1.  **Avoid Dead Code**: If a test is replaced by a newer "Flow-based" version, mark the old file for deletion.
2.  **Serial blocks**: Use `test.describe.serial` for multi-step lifecycles that share a single page for speed.
3.  **Atomic tagging**: Tag suites at the `describe` level with persona (`@leader`) and run-level (`@smoke`) for consistent filtering.

---

## ⏭️ Roadmap
- [x] **Integrated Session Lifecycle**: Unified Group+Session flow implemented.
- [x] **Session Leak Prevention**: Global `forceLogout` protection applied.
- [ ] **Cross-Browser Validation**: Verify Webkit/Safari after locator stabilization.
- [ ] **Mobile Simulation**: Test critical paths on mobile viewports.

---
*Handed over by Antigravity AI Architecture Team.*
