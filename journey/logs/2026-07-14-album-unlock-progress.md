# 专辑解锁进度 · 实施日志

计划：`journey/plans/2026-07-14-album-unlock-progress.md`

## 实施

- 新增 `SummaryCardAlbumProgress`，放在「岁月音乐墙（岁月留声机）」之后。
- 专辑范围和封面直接读取 `src/data/cover.ts` 的九张 `coverIdMap`；每张专辑的曲目按 `songList.meta.album` 聚合。
- 听过状态复用音乐墙的 `tourSongs.appearances.some(isHeard)`，展示总览、封面、已听/总首数、百分比进度条和逐曲解锁标签。
- 未增加 D1 查询或 `SummaryData` payload；曲库外惊喜曲与非九张正式专辑的曲目不影响完成度。

## 验证

- `bunx biome lint src/pages/summary/cards/SummaryCardAlbumProgress.tsx` 通过。
- `bun run typecheck`、`bun run build` 与 `git diff --check` 通过。
- 本地 Vite 开发服务器对 `/summary` 返回 HTTP 200。
- `bun run lint` 仍被本改动前已有的规则报错阻断：`FormPage.tsx`、`LoadingPage.tsx`、`SummaryContainer.tsx` 的 `void` 调用，以及 `concert-store.ts` 的 UUID 位运算；新卡没有 lint 报错。
