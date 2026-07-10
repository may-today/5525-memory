# 最小众歌单卡实现记录

按 `journey/plans/2026-07-10-rare-songs-card.md` 实现，一次通过为主，两处走查后调整。

## 完成内容

- `src/server/summary.ts`：`RareSongEntry` / `RareSongStats` / `queryRareSongStats`（两条语句 db.batch，JS 侧合并排序），并入 `getSummaryData`。
- `src/pages/summary/cards/SummaryCardRareSongs.tsx`：主纸条（和纸胶带 + 「仅此一次」印章）+ 2 列小纸条网格 + 零状态。
- `src/index.css`：`.summary-note-*` 样式（折痕纸面、胶带、印章 radial mask、追光）、`summary-note-drop` 飘落关键帧、reduced-motion 追加。
- `SummaryContainer` 插入到 Playlist 之后；嘉宾星球眉标 05→06、你的回忆 06→07；`journey/design.md` 新增第 8 节并顺延编号。

## 走查后的调整

1. **标题孤字**：「……偏偏被你撞见了。」在 390px 宽下「了。」单独折行，改为「全巡演最少被唱的歌，偏偏被你撞见。」收进一行。
2. **单场用户的语义漏洞**：只选 1 场时人人 heardCount = 1，冷门榜尾部混进《顽固》（全巡演 ×33）这类常驻曲，与「冷门曲」文案不符。新增 `RARE_SONG_TOUR_COUNT_MAX = 8` 门槛（约 5% 场次），只作用于小纸条网格；主纸条不受限（用户听过的最冷门一首永远展示，文案按 tourCount 自适应）。

## 验证方式

Chrome 扩展未连接，改用 playwright-core + 本机缓存的 headless chromium 走查：注入 `concert-form-data:v1` localStorage 模拟选场，键盘翻页（先把 `data-scroll-container` 滚到底再 ArrowDown）到第 6 卡截图。覆盖三分支：多场（4 场，命中「仅此一次」印章）、单场（tourCount > 1 文案、门槛过滤）、零状态。SQL 语义先在本地 D1 SQLite 上用 CTE 验证。脚本在会话 scratchpad，未入库。
