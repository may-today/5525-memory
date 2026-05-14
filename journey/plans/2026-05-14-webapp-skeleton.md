# Plan: Mobile Webapp Skeleton (2026-05-14)

## Goal

Scaffold the minimal framework for the 5525 Memory annual summary webapp.

## Scope

Pages only — no real data, statistics, or share image generation.

## Routes

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `CoverPage` | Title + "开始回忆" button |
| `/form` | `FormPage` | Textarea for show entries |
| `/loading` | `LoadingPage` | Auto-advances after 2s |
| `/summary` | `SummaryContainer` | Swipeable summary cards |
| `/share` | `SharePage` | Disabled save/share buttons |

## Status: Complete
