---
description: "Use when implementing Sprint 4 finance features: Express.js database connection, JWT auth middleware for private routes, Savings Runway calculation, monthly red-alert trigger, and Login/Register UI slicing with validation feedback using Toastify or SweetAlert."
name: "Sprint 4 Auth, DB, and Savings Alert"
applyTo:
  - "backend/src/**/*.js"
  - "frontend/src/**/*.{js,jsx,ts,tsx}"
---

# Sprint 4 Delivery Rules (Week 4)

Use this instruction for all Sprint 4 implementation work.

## Scope and goals

- Sprint focus: database readiness, backend-database connectivity, auth security, savings runway alerts, and CRUD feature delivery.
- Work on branch context: `feat/auth-savings-alert`.

## Mandatory backend rules

- Ensure the database schema exists and matches the approved ERD from the previous sprint before feature coding.
- Configure database connection in Express.js backend first, then verify backend can connect without runtime errors.
- Add a simple DB connectivity test query (`SELECT 1` or equivalent) and fail fast on connection errors.
- Start model/query implementation for each table used by assigned CRUD features.
- ORM or query builder usage is optional, but if used it must be consistent across new modules.

## Security rules

- Implement JWT-based authentication.
- Create and use `authMiddleware` to protect all private routes.
- Public routes (for example login/register) must remain accessible without token.
- Reject invalid or missing token requests with clear HTTP status and JSON error messages.

## Savings Runway logic

- Implement this exact formula:
  - `Runway_Days = Current_Balance / Average_Daily_Spending`
- Validate input data before calculation:
  - `Average_Daily_Spending` must be greater than `0`.
  - Return safe fallback/error response if values are invalid.
- Keep calculation logic deterministic and unit-testable (no hidden side effects).

## Alert system rules

- Trigger and send `Budget Red Alert` when:
  - `Runway_Days < Days_Remaining_In_Month`
- Compute remaining days using `Asia/Jakarta (WIB)` timezone.
- Alert generation must be idempotent for the same evaluation window to avoid duplicate spam.
- Delivery format for Sprint 4: include a backend API response flag for alert status.

## Frontend Login/Register slicing

- Build Login and Register UI slices/screens.
- Add client-side validation and show friendly error feedback.
- Standardize on Toastify (`react-toastify`) for validation and request-error handling.
- Include loading and failure states during auth API calls.

## Collaboration and CRUD progress

- Each team member should continue CRUD implementation according to assigned table/feature scope.
- Keep API contracts clear so auth, runway logic, and CRUD endpoints integrate cleanly.

## Delivery checks before merge

- Backend connects to DB without errors.
- DB test query executes successfully.
- Private routes are protected by JWT middleware.
- Runway calculation follows required formula.
- Red alert condition works against remaining month days.
- Login/Register UI supports validation with Toastify/SweetAlert and handles error states.
