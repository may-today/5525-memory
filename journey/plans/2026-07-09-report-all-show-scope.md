# Report All-Show Scope

## Goal

Extend the report tools so the same statistic dimensions can run against either the user's selected shows or all non-hidden tour shows.

## Design

- Add `concertScope: 'selected' | 'all'` to existing report tools.
- Keep default behavior as `selected` for personal questions.
- Use `all` when the user asks about all shows, the whole tour, or all #5525 records.
- Add `section: 'all' | 'main' | 'request' | 'encore'` to song ranking and song timeline tools so questions like "所有场次中唱过最多的点歌" map to all shows + request songs.
- Continue to forbid free-form SQL; all results come from controlled D1 helpers.

## Verification

- `bun run typecheck`
- `bun run lint`
- `git diff --check`
- `bun run build`
