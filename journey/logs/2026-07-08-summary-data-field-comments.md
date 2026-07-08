# Summary Data Field Comments Log

## 2026-07-08

- Read `journey/design.md`, `src/server/summary.ts`, `src/server/shows.ts`, the D1 schema, and summary card consumers.
- Confirmed `getSummaryData` field sources:
  - show catalog fields come from `queryAllShows` / `queryShowsByIds`;
  - overview counts are derived from selected shows;
  - city markers are derived from selected cities, or all cities when no shows are selected;
  - song stats are queried from `setlist_items` with `item_type = 'song'`;
  - guest stats are built from all non-hidden shows with guests, then marked with selected-show membership.
- Converted the `src/server/summary.ts` field comments to Chinese per request.
