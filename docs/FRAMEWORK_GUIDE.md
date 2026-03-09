# 📘 Framework Master Guide - Playwright Enterprise

**Last Updated:** March 09, 2026  
**Status:** ✅ Configuration Corrected | **Tests:** 65 Total | **Stability:** 100% (Node Types Added)

---

## 🏗️ Architecture Overview

The framework follows a multi-layered Enterprise Page Object Model (POM) to ensure high maintainability and scalability.

- **`config/`**: Centralized environment configuration (URL/Env/Flags).
- **`lib/pages/`**: Single-page atomic objects containing locators and basic actions.
- **`lib/helpers/`**: High-level business orchestration (e.g., `LeaderHelper.registerNewLeader`).
- **`lib/utils/`**: Technical cross-cutting concerns (Logger, Data Generator, Verification Services).
- **`lib/data/`**: Static constants (Messages, Roles, UI Labels) to prevent hardcoding.
- **`specs/`**: Clean test flows focusing only on business intent and assertions.

---

## 🛠️ TypeScript & Environment Configuration

To ensure enterprise-grade reliability and IDE support, the project uses a strict TypeScript configuration:

*   **Type Definitions**: `@types/node` is installed to provide full support for global objects like `process` and `Buffer`.
*   **Compilation Rules**: `tsconfig.json` is configured with `ESNext` targets and `CommonJS` modules for maximum compatibility with both Node.js and Playwright.
*   **Environment Validation**: `config/env.ts` performs strict, early validation of `.env` variables, failing fast if the environment isn't properly configured.

---

## 🚀 Execution & Reporting

### Primary Commands
| Command | Purpose |
|---------|---------|
| `npx playwright test --grep "@smoke"` | Run critical path scenarios |
| `npx playwright test --grep "@e2e"` | Run full lifecycle journeys |
| `npx playwright test --list` | List all discovered tests and locations |
| `npm run allure:report` | Generate and open Allure visual report |

### Optimized Execution
*   **Parallelism**: Configured for 2 workers. Flows tagged with `@e2e` or in lifecycle directories are restricted to 1 worker for state safety.
*   **Environment Flags**: `CI=true` automatically triggers headless mode and stricter failure reporting.

---

## ⚡ Key Enterprise Features

### 1. OTP Bypass Mechanism (Staging Only)
To eliminate costs and dependencies on 3rd-party email providers (like Mailinator), we have a built-in bypass.
*   **Toggle**: `USE_OTP_BYPASS=true` in `.env`.
*   **Prefix**: Automatically uses `pw_auto_mh` prefix for email generation.
*   **Verification**: Automatically uses fixed code `456321`.
*   **Safety**: Strictly disabled for `ENVIRONMENT=live`.

### 2. Multi-Persona Fixtures
The framework utilizes custom fixtures (`leaderPage`, `memberPage`) to manage authenticated browser contexts. This allows for seamless multi-user interaction tests (like Chat) within a single journey.

---

## 🔧 Maintenance & Best Practices

### Adding New Features
1.  **Constants**: Add any new UI labels or messages to `lib/data/constants/`.
2.  **Page Object**: Define locators in the `lib/pages/` directory.
3.  **Handoff**: Wrap multi-page logic into a `lib/helpers/` service.
4.  **Spec**: Keep the `specs/` files readable and focused on assertions.

---

## ⏭️ Roadmap
- [ ] **Cross-Browser Validation**: Verify Webkit/Safari after locator stabilization.
- [ ] **Mobile Simulation**: Test critical paths on mobile viewports.
- [ ] **Consolidated Reporting**: Refactor remaining failure-case matrices into unified journeys where appropriate.

---
*Handed over by Antigravity AI Architecture Team.*
