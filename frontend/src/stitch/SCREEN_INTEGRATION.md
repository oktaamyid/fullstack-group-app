# Stitch Screen Integration Guide

This frontend uses route-first and Tailwind-only conventions for all incoming Stitch screens.

## Route convention

- Add a screen component in `src/components/screens/`.
- Register route in `src/routes/AppRoutes.jsx`.
- Use one route per screen for predictable PWA entry flow.

## Styling convention

- Use Tailwind utility classes only in React components.
- Keep `src/index.css` for global base styles and custom keyframes only.
- Do not create component-specific CSS files.

## Asset convention

- Store Stitch image assets under `src/stitch/<screen-name>/`.
- Import assets directly in screen components.

## Data bootstrap convention

- Shared connection/bootstrap logic lives in `src/hooks/useConnectionCheck.js`.
- Screen-specific state stays inside route component.
