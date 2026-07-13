# 随机曲目黑名单筛选 — 实施日志

- 已完成：导出 `randomSongBlackList` 并增加按 `subTheme` 判定的复用函数。
- 已完成：专属歌单与最小众歌单在既有 request/encore 筛选后，按场次主题排除固定曲；全巡演出现次数也使用相同口径。
- 已完成：报告的 request/encore 歌曲排行和时间线使用等价的 D1 SQL 排除条件。
- 验证：本地 D1 已确认黑名单曲目确实出现在对应主题场次的 request/encore 段落；`bun run typecheck`、本次改动文件的 Biome lint 与 `git diff --check` 通过。全仓 `bun run lint` 仍被既有的 8 项问题阻断，均位于本次未改动的表单、加载、汇总容器和 store 文件。
