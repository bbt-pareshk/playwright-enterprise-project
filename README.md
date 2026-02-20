# MentalHappy – Playwright Test Automation Framework  
### *End-to-End Web Automation using Playwright & TypeScript*

---

## Overview

This project is an **end-to-end test automation framework** built to validate critical **user onboarding, authentication, group access, and dashboard flows** for the MentalHappy web platform.

The framework focuses on **UI automation**, ensuring a smooth and secure experience across **signup, login, OTP verification, group joining, and session access journeys**.  
It is designed to be **scalable, maintainable, and CI/CD-ready**, following modern automation best practices.

---

## Key Objectives

- Validate user authentication and onboarding flows  
- Ensure group join and access control behavior  
- Verify dashboard visibility and navigation  
- Support smoke and regression test execution  
- Enable fast feedback for staging and CI pipelines  

---

## Tech Stack

| Technology | Purpose |
|-----------|--------|
| Playwright | End-to-end web automation |
| TypeScript | Test scripting and type safety |
| Node.js | Runtime environment |
| Playwright Test Runner | Test execution |
| Allure / Playwright Reports | Reporting |
| GitHub | Version control |
| CI/CD | GitHub Actions compatible |

---

## Framework Highlights

- Page Object Model (POM) for reusable and clean test code  
- Custom fixtures for authenticated sessions  
- Environment-based configuration (URLs, users, devices)  
- Role-based testing support  
- Smoke and regression execution support  
- Storage state handling for faster test runs  
- Centralized utilities for waits, assertions, and logging  

---

## Project Structure

```text
mentalhappy-playwright/
├── config/              # Environment, URLs, Browser config
├── lib/
│   ├── data/            # Constants (Roles, Messages) & Test Data
│   ├── fixtures/        # Base and Auth fixtures
│   ├── pages/           # Page Objects
│   └── utils/           # Shared utilities (Wait, Logger, DataGen)
│
├── specs/               # Feature-based test specifications
│   ├── features/        # Auth, Dashboard, Group, Profile
│   └── setup/           # Authentication state setup
│
├── storage/             # Cached authentication states
├── playwright.config.ts
├── package.json
├── smoke.bat            # Windows Smoke runner
├── regression.bat       # Windows Regression runner
└── README.md
```

---

## Test Coverage (High Level)

- Authentication (Login, OTP, session handling)
- Group join and access eligibility
- Dashboard access and navigation
- Role-based user validations
- Smoke and regression scenarios

---

## Execution

```bash
# Install dependencies
npm install

# Run all tests
npx playwright test

# Run smoke tests
smoke.bat

# Run regression tests
regression.bat
```

---

## Reporting

- Playwright HTML Report
- Allure Results (if enabled)
- Test results stored under `test-results/`

---

## Author

**Aesha Mangukiya**  
QA Engineer 
