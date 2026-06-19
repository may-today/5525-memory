# TanStack Start Migration

## Goal

Migrate the existing React and Vite single-page application to TanStack Start with server-side rendering on Cloudflare Workers while preserving the current page flow, visuals, and interactions.

## Implementation

- Replace React Router and the hash-based application entry with TanStack Router file routes.
- Move the shared document, theme provider, texture overlay, and constrained page layout into the root route.
- Make browser-only theme initialization safe during server rendering and hydration.
- Configure the TanStack Start and Cloudflare Vite plugins.
- Add Wrangler configuration, type generation, preview, and deployment scripts.
- Update project documentation and the canonical design snapshot.

## Routes

- `/` renders the cover page.
- `/form` renders the concert form.
- `/loading` renders the timed loading screen.
- `/summary` renders the swipeable summary.
- `/share` renders the share preview.
- Unknown paths redirect to `/`.

## Verification

- Run ESLint and TypeScript checks.
- Build the production application.
- Run a Wrangler deployment dry-run.
- Smoke-test direct route requests and client navigation.

## Constraints

- Do not add business data persistence or new product behavior.
- Do not deploy to the production Cloudflare account as part of this migration.
- Preserve the existing mobile-first layout and dark theme.
