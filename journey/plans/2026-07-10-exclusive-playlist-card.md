# 专属歌单统计卡（SummaryCardPlaylist）

## 目标

在 `/summary` 的「嘉宾星球」之前新增一张统计卡「专属歌单」：

- 统计用户去过的所有场次中，**随机曲目（点歌 + 安可）**每首歌被听到的次数排行。
- 用排行条可视化浮现歌曲名与出现次数。
- 主文案突出用户的「常驻曲」（出现次数最多的随机曲目）。

## 数据口径

- D1 `setlist_items`：`item_type = 'song'` 且 `section = 'request'`（点歌）或 `section LIKE 'encore_%'`（安可），与报告页 `report-stats.ts` 的分段口径一致。
- 本地 D1 实测：每场随机曲目 7–17 首（中位约 12–13），全巡演点歌 690 行 + 安可 1259 行；跨场次用户会自然产生重复计数，排行成立。
- 排行取 Top 10，`ORDER BY cnt DESC, title` 保证平票时确定性排序（SSR 稳定）。
- 另返回 `uniqueCount`（去重曲目数）与 `totalPlays`（随机曲目总行数）供文案使用。

## 服务端改动（src/server/summary.ts）

- 新增 `RandomSongEntry` / `RandomSongStats` interface，`SummaryData` 增加 `randomSongStats` 字段。
- 新增 `queryRandomSongStats(db, showIds)`：与 `querySongStats` 同构，用 `db.batch` 一次跑 Top 10 + 总量两条 SQL；`showIds` 为空时返回零值。
- 并入 `getSummaryData` 的 `Promise.all`。

## 前端改动

- 新增 `src/pages/summary/cards/SummaryCardPlaylist.tsx`：
  - 眉标 `04 / 专属歌单`；「嘉宾星球」改 05、「你的回忆」改 06。
  - Hero：「你的常驻曲」标签 + 大号歌名（WJH 字体 + 主题色辉光，复用 report-hero 的 color-mix 手法）+ Doto 点阵体次数；副文案「在你去过的 N 场里，它出现了 X 次」。
  - 排行条：单序列单色（品牌橙 `#f97316`），细条（h-1.5）圆角、首位全亮其余 0.55 透明度（沿用 ReportCard RankBlock 模式）；数值用文本色不用序列色；无图例（单序列）。
  - 动画：条形 scaleX 逐条延迟生长（compositor-only），`prefers-reduced-motion` 下停用（加入 index.css 现有 reduced-motion 块）。
  - 内容可能超出小屏，外层用 `data-scroll-container` 复用容器滚动优先切页逻辑。
  - 零状态（未选场次或无随机曲目记录）：居中文案，风格对齐嘉宾星球零状态。
- `SummaryContainer`：`CARDS` 在 `SummaryCard3` 与 `SummaryCardGuests` 之间插入新卡（City 卡仍是 index 1，`isPaused` 特判不受影响）。
- `src/index.css`：新增 `.summary-playlist-bar` / `.summary-playlist-hero` 等样式与动画。

## 验证

- `bun run dev` + 浏览器走查 `/form → /summary`，选多场后确认排行与常驻曲正确、动画与切页正常。
- 类型检查 / lint 按 package.json 现有脚本执行。
- dataviz 校验：单色标记在深色面（zinc-950）上跑一次 validate_palette 确认对比度。
