# Guest Summary Stats

## Goal

Add a guest-show statistics entry to `getSummaryData`, so `/summary` can receive every non-hidden tour show that includes guest performers, plus whether the current user selected that show.

## Scope

- Extend the server-side summary data types.
- Derive guest statistics from existing `Show.guests` data returned by `queryAllShows`.
- Keep the existing single `getSummaryData(showIds)` request shape.
- Record the effective data contract in `journey/design.md`.

## Data Contract

`SummaryData.guestStats.guestShows[]` returns:

- `showDate`
- `show`: basic show identity and display fields
- `guests`
- `isVisited`

## Verification

- Run TypeScript/build checks available in the repo.
