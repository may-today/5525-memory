# Guest Summary Stats Log

## 2026-07-08

- Added `SummaryData.guestStats.guestShows` in `src/server/summary.ts`.
- The field is derived from all non-hidden shows already fetched by `getSummaryData`.
- Each guest show includes `showDate`, basic show display information, `guests`, and `isVisited`.
