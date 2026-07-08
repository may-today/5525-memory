# Two-step form log

## 2026-07-08

- Started implementation to split `/form` into profile collection and show selection steps.
- `raw-demo/BaseInformationForm.tsx` is untracked and used only as a visual/interaction reference.
- Added `concertStore.profile` persistence under the existing `concert-form-data:v1` key.
- Updated `/form` to render profile collection first and the existing show picker second.
- Replaced free-text city entry with a fixed city/province select sourced from `raw-demo/geoCoord.ts`.
- Added an app-level shadcn-style toast provider and used it for unavailable/failed browser geolocation.
- Swapped the city select to the shared `src/components/ui/combobox.tsx` component.
