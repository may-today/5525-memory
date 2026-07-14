# 串烧歌曲统计 · 实施日志

计划：`journey/plans/2026-07-14-medley-song-statistics.md`

## 实施

- 在 `src/server/summary.ts` 新增统一的 `expandSongItems`：普通 `song` 保持原样；`medley` 以半角或全角加号拆分、逐项 `trim`、丢弃空标题。
- 基础歌曲总数与最高频歌曲、`tourSongs` 出现记录、专属／最小众／四季随机曲目统计都改为消费展开后的条目。
- 因音乐墙与九张专辑直接消费 `tourSongs`，串烧内每首曲目会自动进入巡演实际演唱列表、个人听过状态和专辑解锁覆盖度，无需前端修改或增加 D1 查询。
- `journey/design.md` 已记录统一的串烧歌曲口径。
- 后续统一标题清理：普通歌曲与串烧拆分后的每个标题都删除 emoji 和全部空白后再参与 `buildTourSongs` 及其他歌曲汇总，避免同曲的演出装饰或空格差异产生重复条目。

## 验证

- `node_modules/.bin/biome lint src/server/summary.ts` 通过。
- `node_modules/.bin/tsc -b` 通过。
- `git diff --check` 通过。
- 本环境的 `bunx @tanstack/intent` 会因受限临时目录报 `PermissionDenied`，故未能读取其 server-functions 文档；实现保持既有 `createServerFn` 边界与单次快照聚合模式。
