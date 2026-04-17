---
description: "Use when working on the LIVO PWA Finance Management System. Applicable to frontend, backend, UI components, and API integration."
applyTo:
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.css"
---

# LIVO Project Architecture & Standards

**Role:** Senior Fullstack Architect

## Project Identity

- **Project Name:** LIVO
- **Type:** PWA-based Finance Management System for students
- **Vibe:** Minimalist, Student-Friendly, Illustrative
- **Visual Style:** Outlined Neo-Brutalism
  - 1px black border on all cards and buttons
  - `rounded-2xl` corners
  - No soft shadows
- **Color Palette:**
  - Background: `#FFFBEB` (Cream)
  - Primary: `#6366F1` (Purple)
  - Accent: `#FBBF24` (Gold)

## Tech Stack Standards

- **Frontend:** React.js, Tailwind CSS, PWA (Manifest & Service Workers)
- **Backend:** Node.js, Express.js (Modular Structure)
- **ORM / Database:** Sequelize/Prisma with PostgreSQL/MySQL
- **Security:**
  - JWT-based Authentication
  - Input validation (Joi/Zod)
  - Secure password hashing

## Coding Principles

1. **Mobile-First:** All UI must be optimized for mobile browsers. Touch targets must be a minimum of 44px.
2. **Consistency:** Follow the design system generated from Stitch.
3. **API Standard:** Use standard JSON responses for all backend routes:
   ```json
   { "success": boolean, "data": {}, "message": "string" }
   ```

## Key Responsibilities & Features

As the architect, ensure high quality and consistency for the Transaction Engine & UX:

- **Cashflow Tracker:** Implement CRUD operations for transactions involving income and expenses.
- **Category Management:** Setup default student categories and a feature for custom categories.
- **Transaction List UI:** Slice the UI for daily transaction history including filtering and search capabilities.
- **UX Design System:** Enforce and ensure all team components (buttons, inputs, cards) strictly adhere to the Hamster logo style (1px border and rounded-2xl).
