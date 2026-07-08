# 你的回忆（Memories）统计页

## 目标

在 `/summary` 新增一页「你的回忆」，回顾用户参加过的每一场演出中值得纪念的内容。整体走绚丽/酷炫方向，采用**长列表 + 视差滚动**的呈现方式。目前没有真实回忆数据，全部内容用占位数据渲染，先把版式和滚动演出做出来。

## 每条回忆的内容结构

- **场次信息**：日期（等宽字体大号展示）、城市、场馆、场次标签（DAY1 / 安可场等）、子主题。
- **图片 + 一句介绍**：回忆照片（占位：主题色渐变框 + 占位提示），下方一行 caption。
- **长文字**：值得回味的内容（如当场 talking），占位文案循环取自常量表。

## 设计决策

- **位置**：追加为最后一张卡片（`05 / 你的回忆`），紧接「嘉宾星球」，作为进入 /share 前的情感收束——底部悬浮的「生成总结」按钮正好压在这页上。
- **数据来源**：条目直接由 `SummaryDataContext` 的 `selectedShows` 生成（按日期排序），每场一条回忆；照片、caption、talking 均为占位。未选择任何场次时，取 `allShows` 前 3 场作为「示例回忆」并显式标注。
- **页内滚动**：滚动容器加 `data-scroll-container`，复用 `SummaryContainer` 的滚动优先切页逻辑（滚到底才能切下一页 / 滚到顶才能切回上一页）。
- **视差实现**：不用 CSS scroll-driven animations（Safari 覆盖不稳），用滚动容器上的 `scroll` 事件 + rAF 节流：每帧对 `[data-parallax]` 条目按「条目中心相对视口中心的偏移」计算进度写入 `--parallax` 变量，各装饰层（照片、主题色辉光、幽灵序号）用不同系数的 `translateY` 制造层次。只动 transform，保持 compositor-only。
- **视觉**：`zinc-950` 深色底延续 Guests 页宇宙氛围；每条回忆用场次 `themeColor` 驱动辉光、渐变占位图与引用符颜色；条目背后放超大描边幽灵序号；条目间用渐变细线分隔；照片框交替微倾斜。
- **可访问性**：`prefers-reduced-motion: reduce` 时不挂滚动监听，CSS 同步取消视差 transform。

## 改动清单

1. `src/pages/summary/cards/SummaryCardMemories.tsx` — 新组件。
2. `src/index.css` — `.summary-memory-*` 样式与 reduced-motion 覆盖。
3. `src/pages/summary/SummaryContainer.tsx` — CARDS 追加新卡片。
4. `journey/design.md` — 新增「你的回忆」页面章节。

## 后续（本次不做）

- 真实回忆数据的来源与建模（用户上传照片？运营维护的场次 talking 精选？）。
- 图片懒加载与 CDN 接入。
