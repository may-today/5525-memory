# 专属歌单统计卡实现记录

计划见 `journey/plans/2026-07-10-exclusive-playlist-card.md`。

## 完成内容

- `src/server/summary.ts`：新增 `RandomSongEntry` / `RandomSongStats` interface 与 `queryRandomSongStats(db, showIds)`（`db.batch` 一次跑 Top 10 排行 + totalPlays/uniqueCount 两条 SQL；空选择返回零值），`SummaryData` 增加 `randomSongStats` 并入 `getSummaryData` 的 `Promise.all`。口径 `item_type='song'` 且 `section='request'` 或 `section LIKE 'encore_%'`，与 `report-stats.ts` 一致；`ORDER BY cnt DESC, title` 保证平票确定性。
- `src/pages/summary/cards/SummaryCardPlaylist.tsx`：新卡片。Hero 常驻曲（WJH + 橙色辉光）+ 文案；Top 10 排行条（首位全亮 + 辉光、其余 0.55；数值用文本色）；`data-scroll-container` 滚动优先；双零状态（未选场次 / 无点歌安可记录）。
- `SummaryContainer`：`CARDS` 在 `SummaryCard3` 与 `SummaryCardGuests` 之间插入；City 卡仍是 index 1，`isPaused` 特判不受影响。
- 编号顺延：专属歌单 04、嘉宾星球 04→05（两处）、你的回忆 05→06。
- `src/index.css`：`.summary-playlist-hero` / `.summary-playlist-row` / `.summary-playlist-bar`（复用 `report-bar-grow` 关键帧），并加入 `prefers-reduced-motion` 块。
- `journey/design.md`：新增「7. 专属歌单」章节，嘉宾星球/你的回忆顺延为 8/9，更新当前状态。

## 验证

- `bun run typecheck`、`biome lint` 通过。
- SSR 冒烟：`curl /summary` 200，正常渲染 loading 态。
- 端到端数据：用 seroval `toJSONAsync` 手工构造负载直接 POST `getSummaryData` 的 `/_serverFn/...` 端点（需带 `Origin` 头过 CSRF），传入 8 个场次 id（266–271、261、262），返回的 `randomSongStats` 与直接对本地 SQLite 跑同口径 SQL 的期望完全一致：倔强 8、知足 8、如果我们不曾相遇 6、笑忘歌 5……，totalPlays 81、uniqueCount 46。
- 浏览器可视化走查未做（Claude in Chrome 扩展未连接），动画与布局需人工过一眼。

## 备忘

- dataviz 校验：`#f97316` 在 zinc-950 上对比度 ≥3:1 通过；lightness band FAIL 仅适用于多色分类色板，单强调色 + 数值文本标注不受影响。
- 手调 server fn 端点的姿势（调试可复用）：函数 id 是 base64 的 `{"file":"/src/server/summary.ts?tss-serverfn-split","export":"getSummaryData_createServerFn_handler"}`，body 为 `JSON.stringify(await toJSONAsync({ data: showIds }))`。
