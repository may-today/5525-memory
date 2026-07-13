# 四季歌单卡重设计：四季光场（过程日志）

日期：2026-07-14 · 计划：`journey/plans/2026-07-14-seasonal-playlist-redesign.md`

## 完成内容

- 服务端新增 `SeasonalSongStats`（`src/server/summary.ts`）：与专属歌单同一
  `isRandomSong` 口径，按场次日期月份分进春（3–5）夏（6–8）秋（9–11）冬（12–2）
  四季（与 `report-stats.ts` 季节筛选一致），每季取出现次数最高的一首（平票按
  `compareTitles`，SSR 确定）；复用 `selectedSetlistItems` 内存快照，无新增 D1 查询。
- `SummaryCardSeasonalPlaylist` 从占位骨架重写为「四季光场」：四片季节色
  radial-gradient 从象限外角向中心晕开，中心保持深色；DOM 顺序春夏秋冬，
  秋冬用 grid-area 换到下排对角位，下排两格 column-reverse 让季节字始终贴外角。
  季节四色：春樱粉 `#fda4af`、夏海青 `#5eead4`、秋琥珀 `#fbbf24`、冬蓝紫 `#a5b4fc`。
- 动画：光场顺时针错峰淡入（0.18s 间隔）+ 16s 呼吸以 -4s 错相（一年四相位）；
  歌名淡入上移。全部 opacity/transform；reduced-motion 全停用。
- 零状态改为「四季都无歌」才整卡退化（原来是 randomSongStats.entries 为空）。

## 用户反馈迭代

1. **边界割裂**：光场区非全屏，与页头/注脚之间有生硬边界 → 给四宫格加
   `border-white/10` + `rounded-2xl` + `overflow-hidden` 画框，`mx-6` 与文字边距
   对齐；光场在圆角框内裁切，边界成为有意的构图。（曾提出全出血备选，未采用。）
2. **去月份标识 + 歌名放大**：季节字旁的 `3 — 5 月` 小注移除；歌名 text-2xl →
   text-3xl，且歌名块 `flex: 1` + 垂直居中占满象限剩余空间——季节字留在四角，
   歌名向画面中带聚拢，解决四角构图导致的中心空洞。

## 弯路与坑

- `bunx ultracite fix src/index.css` 会把整个文件重排（3000+ 行 churn，存量文件
  不符合当前 biome 格式基线），已回退并手动按文件既有 4 空格风格写入新块；
  仓库 `bun run check` 在干净基线上本就不通过，不能作为本次改动的验收信号。

## 验证

- `bun run typecheck` 通过。
- 用户在本地 dev server 浏览器中确认视觉效果（含两轮反馈迭代后的终态）。
