# Summary Data Field Comments

## Goal

Document every field returned by `getSummaryData` directly in the TypeScript interfaces, including the field purpose and how the server function computes it.

## Scope

- Add JSDoc comments to `src/server/summary.ts` summary-related interfaces.
- Keep runtime behavior unchanged.
- Record completion notes in the matching journey log.

## Notes

- Comments must stay in English per repository style.
- `getSummaryData` returns the single consolidated payload for `/summary`; Card2 mileage remains out of scope.
