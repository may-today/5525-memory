# 巡演歌曲曲库分类记录

## 2026-07-12

- 开始将完整巡演快照中的歌曲行按 `src/data/song-list.ts` 分类，作为 `getSummaryData` 的后续可复用数据。
- 本地 D1 抽查确认歌单含 emoji、标点和空白差异；分类会归一化这些演出装饰，并维护「乾杯」「派推动物」「笑忘歌新年倒数」三个已知标题别名，避免误归入惊喜歌曲。
- 已在 `getSummaryData` 返回 `tourSongs`；`maydaySongs` 使用曲库标准元数据，`surpriseSongs` 使用去装饰后的曲名。`bun run typecheck`、Biome 和生产构建均通过。
- 根据后续消费需求，`tourSongs` 改为扁平的 `{ title, type }[]`，不再返回曲库元数据；五月天歌曲在前，惊喜歌曲随后。
