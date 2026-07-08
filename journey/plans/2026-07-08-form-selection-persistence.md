# Form Selection Persistence Plan

## Goal

Update the form page so selected shows persist in `localStorage`, show rows no longer display start time, and the sticky selected count can clear the current selection.

## Scope

- Hydrate selected shows from persisted IDs after `/form` loader data is available.
- Keep `concertStore.selectedShows` mirrored to `localStorage` whenever the store changes.
- Add a clear action for the current selection.
- Remove start time from show item display.

## Verification

- Run TypeScript checks after implementation.
- Confirm formatting/lint issues in touched files if needed.
