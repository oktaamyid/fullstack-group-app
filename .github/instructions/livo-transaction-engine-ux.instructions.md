---
description: "Use when building LIVO transaction features, category management, transaction history UI slicing, and enforcing neo-brutalist mobile-first UX consistency across React + Express modules."
name: "LIVO Transaction Engine and UX Consistency"
applyTo:
  - "backend/src/**/*.js"
  - "frontend/src/**/*.{js,jsx,ts,tsx,css}"
---
# LIVO Role Instruction: Senior Fullstack Architect

## Product identity

- Product: LIVO (PWA finance management for students).
- Vibe: minimalist, student-friendly, illustrative.
- Design language: outlined neo-brutalism.
  - Every interactive component/card uses `1px` solid black border.
  - Corners use `rounded-2xl`.
  - Do not use soft shadows.
- Core palette:
  - Background: `#FFFBEB` (cream)
  - Primary: `#6366F1` (purple)
  - Accent: `#FBBF24` (gold)

## Tech stack standards

- Frontend: React.js + Tailwind CSS + PWA assets.
  - Maintain/update manifest and service worker when relevant.
- Backend: Node.js + Express.js with modular structure.
- Database: Sequelize or Prisma with PostgreSQL/MySQL.
- Security baseline:
  - JWT auth for protected APIs.
  - Input validation with Joi or Zod.
  - Secure password hashing for credential flows.

## Architecture and response contract

- Keep API responses consistent in JSON format:
  - `{ "success": boolean, "data": {}, "message": "" }`
- Apply this contract for success and failure responses (with meaningful `message`).

## Ownership: Transaction Engine and UX Consistency

### 1. Cashflow Tracker

- Implement full CRUD for:
  - Income transactions.
  - Expense transactions.
- Enforce validation for amount, date, category, and transaction type.
- Keep transaction endpoints auth-protected unless explicitly public.

### 2. Category Management

- Provide default student categories (for example: food, transport, tuition, books, freelance, allowance).
- Allow users to create custom categories.
- Prevent duplicate category names per user scope when relevant.

### 3. Transaction List UI Slicing

- Build daily transaction history views.
- Include filter and search behavior.
- Prioritize touch-friendly mobile interactions and clear empty states.

### 4. UX Design System Enforcement

- Ensure shared UI components (button, input, card) are consistent across team outputs.
- Mandatory component styling:
  - `border border-black`
  - `rounded-2xl`
  - no soft shadow utilities.
- Keep visual style aligned with LIVO mascot/brand direction.

## Mobile-first enforcement

- Start layout from small screens first.
- Ensure minimum touch target size is `44px` for tappable controls.
- Verify forms and filters are usable on mobile browsers before desktop polish.

## Collaboration rules

- Follow Stitch-generated structure and interaction patterns as the design source of truth.
- Reuse shared components before creating new variants.
- Keep naming and folder structure predictable for cross-team integration.
