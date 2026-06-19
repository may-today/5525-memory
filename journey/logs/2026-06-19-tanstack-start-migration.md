# TanStack Start Migration Log

## 2026-06-19

- Confirmed Cloudflare Workers as the deployment target.
- Confirmed standard TanStack Start SSR and clean URL paths.
- Started migration from the existing Vite SPA and HashRouter architecture.
- Added TanStack Start file routes and moved the shared layout into the root document.
- Replaced React Router navigation with typed TanStack Router navigation.
- Made theme initialization safe for server rendering.
- Added Cloudflare Vite and Wrangler configuration.
- Added a server-side splat redirect after smoke testing showed that a root not-found component retained a 404 status.
- Generated Cloudflare Worker runtime types and the TanStack route tree.
- Verified ESLint, TypeScript, the production client and SSR builds, and Wrangler deployment dry-run.
- Verified `/`, `/form`, `/loading`, `/summary`, and `/share` return HTTP 200 from the local Worker preview.
- Verified unknown paths return HTTP 307 and redirect to `/`.
