# Two-step form

## Goal

Split `/form` into two form steps:

1. Collect optional user nickname and location city.
2. Keep the existing show selection workflow.

## Approach

- Extend `concertStore` with a persisted `profile` object while keeping the existing `showIds` persistence format compatible.
- Add profile hydration on `/form` mount.
- Render a first step inspired by `raw-demo/BaseInformationForm.tsx` using the current project's UI primitives and TanStack Store.
- Keep the existing city accordion show picker as the second step.

## Verification

- Typecheck or build the project after edits.
- Confirm existing selected show persistence still reads `showIds` from `concert-form-data:v1`.
