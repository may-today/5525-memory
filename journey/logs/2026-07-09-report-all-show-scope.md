# Report All-Show Scope Log

## 2026-07-09

- Started expanding report tools from selected-show-only scope to selected/all scope.
- Intended new example: "所有场次中唱过最多的点歌" should call song ranking with all non-hidden shows and request-section filtering.
- Added `concertScope` to report tools. Default remains selected shows; `all` queries all non-hidden shows with the same statistic dimensions.
- Added `section` to song tools so rankings, timelines, and period rankings can filter all songs, main songs, request songs, or encore songs.
- Updated report prompt guidance so all-tour language maps to `concertScope="all"` and 点歌 language maps to `section="request"`.
- Verified with `bun run typecheck`, `bun run lint`, `git diff --check`, and `bun run build`. Build completed with the existing Wrangler local log-file `EPERM` warning.
