# 5525 Memory — Design

## What It Is

A mobile-first annual summary webapp for the Mayday #5525 live tour. Users fill in the concerts they attended, and the app generates a visual, shareable summary of their experience.

## Current State (2026-05-14)

Minimal skeleton scaffolded. Navigation works end-to-end. No real data logic yet.

## Architecture

- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn
- **Routing**: `react-router-dom` with `HashRouter` (static-hosting friendly)

## Page Flow

```
/ (Cover) → /form → /loading → /summary → /share
```

## Key Design Decisions

### HashRouter over BrowserRouter
Static deployment (GitHub Pages, etc.) does not support server-side URL rewriting, so `HashRouter` avoids 404s on direct navigation.

### Summary as single route with internal state
`/summary` renders `SummaryContainer` which manages `currentIndex`. Individual cards are components, not routes. This enables animated horizontal transitions and avoids URL churn for swipe gestures.

### Swipe vs. in-page scroll
Touch handler on `SummaryContainer` checks `abs(deltaX) > abs(deltaY) && abs(deltaX) > 40px` before treating a touch as a horizontal swipe. Otherwise the event falls through to the browser for normal vertical scroll. Each card is `overflow-y: auto` and can scroll independently.

## Open Questions / Future Work

- Data model for concert form (dates, venues, seat info?)
- State persistence across pages (context, URL params, or sessionStorage)
- Summary statistics logic
- Parallax / scroll animations within summary cards
- `html2canvas` or similar for share image generation
