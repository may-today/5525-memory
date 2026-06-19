# 5525 Memory — Design

## What It Is

A mobile-first annual summary webapp for the Mayday #5525 live tour. Users fill in the concerts they attended, and the app generates a visual, shareable summary of their experience.

## Current State (2026-06-19)

The app is migrated to TanStack Start and navigation works end-to-end. The form uses the real show catalog and persists the user's selected show IDs for the summary flow.

## Architecture

- **Framework**: TanStack Start + React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn
- **Routing**: TanStack Router file-based routes with server-side rendering
- **Deployment**: Cloudflare Workers through the Cloudflare Vite plugin

## Page Flow

```
/ (Cover) → /form → /loading → /summary → /share
```

## Key Design Decisions

### Standard paths with server-side rendering
Cloudflare Workers handles direct route requests, so routes use clean paths such as `/form` instead of hash URLs. The root route owns the HTML document, shared layout, and theme provider.

### Cloudflare Workers runtime
The application uses the default TanStack Start server entry through the Cloudflare Vite plugin. Wrangler enables `nodejs_compat` and observability. No Cloudflare data bindings are required yet.

### Show catalog and form state
`data/shows.json` is the current show catalog. The form groups visible shows by city, allows multi-selection, and stores selected numeric IDs in `sessionStorage` under `concert-form-data` before navigating to `/loading`.

### Summary as single route with internal state
`/summary` renders `SummaryContainer` which manages `currentIndex`. Individual cards are components, not routes. This enables animated horizontal transitions and avoids URL churn for swipe gestures.

### Swipe vs. in-page scroll
Touch handler on `SummaryContainer` checks `abs(deltaX) > abs(deltaY) && abs(deltaX) > 40px` before treating a touch as a horizontal swipe. Otherwise the event falls through to the browser for normal vertical scroll. Each card is `overflow-y: auto` and can scroll independently.

## Open Questions / Future Work

- Summary statistics logic
- Connect summary statistics to the selected show IDs in `sessionStorage`
- Parallax / scroll animations within summary cards
- `html2canvas` or similar for share image generation
