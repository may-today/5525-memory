# 数据电台结尾曲分段：执行记录

- 在 `SongSectionScope`、报告工具 Zod schema 与输入收窄中加入 `ending`。
- `ending` 以相关子查询取同场 `item_type = 'song'` 的最大 `sort_order`；歌曲排行与单曲时间线共用此条件，安可筛选保持不变。
- 更新工具描述、系统提示词和设计文档，明确「结尾曲 / 收尾曲 / 每场最后一首歌」使用 `section=ending`。
- 本地 D1 只读核验：全巡演结尾曲排行第一为《洋葱》18 场，查询条件逐场按最大歌曲排序号取值。
- 验证通过：`bun run lint`、`bun run typecheck`、`git diff --check`。
