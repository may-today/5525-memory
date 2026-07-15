# 唱片详情：巡演全场次方格图

## 需求

唱片架（SummaryCardSongWall）点开唱片的详情页里，「唱过的场次」列表上方加一个方格统计图：全巡演每场一格、按日期排列自动换行，这首歌在该场没唱／被唱过（main）／被点歌（request）／被安可（encore）分别用暗格与三种颜色点亮。

## 实现

- `TourShowGrid` 组件（`src/pages/summary/cards/SummaryCardSongWall.tsx`）：数据来自 context 的 `allShows`（全场次目录，日期升序）与该曲 `appearances`；按 `show.id` 聚合段落集合。**同场多段落真实存在**（D1 里如 OAOA main+encore、爱情万岁 main+request、笑忘歌 request+encore），此时一格内按主歌单 → 点歌 → 安可的顺序上下均分色带（`linear-gradient` 分段填充），tooltip 状态用「＋」连接。头部沿用「标题 + n / N」的小节样式（文案「巡演足迹」），格子下方有四态图例，每格带原生 title tooltip（日期 城市 DAY 标签 · 状态）。
- 样式：`.summary-record-grid-cell`（8px、圆角 2px、暗格 `rgba(255,255,255,0.08)`）在 `src/index.css` summary-record 区块内；点亮背景（纯色或分带渐变）由组件内联注入。
- 滚动结构：最初把场次列表 `max-h` 从 30svh 收窄到 24svh 给方格图腾空间，后反馈内层滚动不合适（列表被压得太矮），改为方格图＋「唱过的场次」整体包进一个 `max-h-[38svh]` 的滚动容器，`<ul>` 不再自己限高滚动。
- 到场高亮：用户参加过的场次格加 `inset 0 0 0 1px rgba(255,255,255,0.65)` 内描边（`.summary-record-grid-cell-attended`），判定用 context 的 `selectedShows`（与该场是否唱过这首歌无关，暗格也能标出到场），图例补「你在场」项，tooltip 追加「· 你在场」。

## 配色

点亮色按段落语义全卡固定（不随唱片紫／金主色变化）：唱过 `#8a72cc`、点歌 `#2e84b0`、安可 `#a86a30`。第一版更亮（`#9678f0/#2b8fc7/#cc7729`），用户反馈过于鲜艳、和暗格对比太抢眼，故整体压暗降饱和并去掉了点亮格的发光 box-shadow。dataviz 校验通过；CVD 最差邻对（蓝↔紫，deutan）ΔE 10.6 落在需辅助编码的 8–12 区间，由格间距、图例与逐格 tooltip 补足。
