# Summary 单次 D1 查询记录

- 已确认 `getSummaryData` 当前一次 RPC 会触发 8 条 D1 语句：场次目录、选中场次、歌曲统计两条、随机曲目统计两条、小众歌曲统计两条。
- 计划改为一次联表读取全量非隐藏场次及歌单行，再在 Worker 内存中复用现有统计口径。
- 已实现单条 `shows LEFT JOIN setlist_items` 快照查询；歌单数用 `COUNT(...) OVER (PARTITION BY show)` 计算，避免联表中重复执行相关子查询。概览、歌曲、随机曲目、小众曲目和嘉宾数据均由这份快照在 Worker 内存中计算，客户端响应结构不变。
- 本地 D1 验证：联表快照覆盖 163 个可见场次与 7,006 行（含无歌单场次的 LEFT JOIN 行），歌单数范围 0–52；`bun run typecheck`、目标文件 Biome 检查和 `bun run build` 均通过。内置浏览器在本会话不可用，因此未做客户端 effect 自动化走查。
