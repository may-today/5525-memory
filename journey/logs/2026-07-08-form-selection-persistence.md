# Form Selection Persistence Log

## 2026-07-08

- Read `journey/design.md` and inspected `FormPage`, `concert-store`, and summary hydration.
- Found an existing `FormPage` diff that removes the primary-city suffix from the bottom selected count; left it intact.
- Added store-level localStorage mirroring for selected show IDs, plus hydration and clear helpers.
- Updated the form rows to show day only, and added a bottom-bar clear button.
- Updated summary fallback and `journey/design.md` to reflect the new localStorage persistence behavior.
- Removed the remaining `sessionStorage` submit snapshot and summary fallback so selected shows have one persistence source.
