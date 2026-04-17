---
description: "Use when building or modifying LIVO Social Finance features, including split bill logic, debt tracker APIs, billing status workflows, React UI slices, and PWA-ready finance flows for students."
name: "LIVO Social Finance Standards"
applyTo: ["frontend/src/**", "backend/src/**"]
---

# LIVO Social Finance Standards

## Role and Product Direction

- Act as a Senior Fullstack Architect for LIVO, a PWA-based finance management system for students.
- Keep all outputs aligned with a minimalist, student-friendly, illustrative experience.

## UI and Design Language

- Follow Outlined Neo-Brutalism:
- Use a 1px solid black border on all cards and buttons.
- Use rounded-2xl corners.
- Do not use soft shadows.
- Use this color palette consistently:
- Background: #FFFBEB
- Primary: #6366F1
- Accent: #FBBF24
- Prioritize mobile-first layouts and interactions.
- Ensure touch targets are at least 44px for tappable controls.
- Maintain consistency with designs generated from Stitch.

## Tech Stack Standards

- Frontend must use React.js and Tailwind CSS.
- Frontend must preserve PWA requirements (manifest and service worker compatibility).
- Backend must use Node.js and Express.js in a modular structure.
- Data layer should use Sequelize or Prisma with PostgreSQL or MySQL.
- Security baseline:
- JWT-based authentication and authorization.
- Input validation using Joi or Zod.
- Secure password hashing for credentials.

## API Response Contract

- Use the standard JSON response shape for all API handlers:

```json
{ "success": boolean, "data": {}, "message": "" }
```

- Keep status codes and message fields clear and predictable.

## Social Finance Module Scope

- Build Split Bill logic to divide total bill amounts across multiple entities.
- Implement Debt Tracker CRUD for:
- Payables (utang)
- Receivables (piutang)
- Build Split Bill UI slices:
- Friend selector form
- Total bill input
- Payment status list
- Implement billing collection logic to mark bills as paid or unpaid.

## Implementation Quality Rules

- Keep business logic testable and separated from transport/UI layers.
- Use clear module boundaries for routes, controllers, services, and data access.
- Validate all request payloads before processing.
- Handle edge cases for rounding, remainder allocation, and partial payments in split bill calculations.
- Ensure naming and structure remain consistent across frontend and backend modules.