# 巡演歌曲曲库分类记录

## 2026-07-12

- 开始将完整巡演快照中的歌曲行按 `src/data/song-list.ts` 分类，作为 `getSummaryData` 的后续可复用数据。
- 本地 D1 抽查确认歌单含 emoji、标点和空白差异；分类会归一化这些演出装饰，并维护「乾杯」「派推动物」「笑忘歌新年倒数」三个已知标题别名，避免误归入惊喜歌曲。
- 已在 `getSummaryData` 返回 `tourSongs`；`maydaySongs` 使用曲库标准元数据，`surpriseSongs` 使用去装饰后的曲名。`bun run typecheck`、Biome 和生产构建均通过。
- 根据后续消费需求，`tourSongs` 改为扁平的 `{ title, type }[]`，不再返回曲库元数据；五月天歌曲在前，惊喜歌曲随后。
- 补充 `tourSongs[].appearances`：每首歌附上在全巡演所有非隐藏场次中的出现记录（场次精简信息 + 该场歌单段落类型 `main`/`request`/`encore` + 用户是否听过这场 `isHeard`）。歌单段落类型从 `setlist_items.section` 归一化（`request` 精确匹配，`encore_*` 前缀匹配，其余归为 `main`），与曲库匹配同一遍循环里顺带累积，不新增查询。场次精简信息抽成 `SummaryShowInfo`（原 `GuestShowInfo` 改名通用化），与嘉宾统计共用同一 mapper `toSummaryShowInfo`，避免字段列表重复维护。`bun run typecheck` 与 Biome check 均通过。
- 应用户要求进一步精简 `SummaryShowInfo`，去掉 `posterUrl`/`themeColor`/`showStartTime`/`showEndTime`/`tourTypeId` 五个当时无消费方的字段。但发现 `themeColor` 实际被 `SummaryCardGuests.tsx` 用于嘉宾星球配色（`guestShow.show.themeColor` → `--planet-color`）；征得用户确认后同步改为固定橙色常量 `PLANET_COLOR = '#f97316'`（与该组件零状态星球已用的颜色一致），星球卡片不再依赖场次主题色。
