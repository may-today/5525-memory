# 巡演时间轴页（场次概览卡）重设计（2026-07-12）

## 背景

`SummaryCardOverview`（`/summary` 第 1 张卡）用 4 张 contribution graph 呈现巡演时间分布，
分两段动画点亮：第一段全巡演场次（原橙色），第二段用户已选场次（原黄色 + 光晕）。
用户反馈：数据死板、文案缺失，且两段点亮差别不明显。

## 目标

1. **第一段点亮按子主题着色**：与表单页一致——5525 粉 `#f472b6`、5525+1 蓝 `#38bdf8`、
   5525+2 橙 `#fb923c`（未知子主题回退场次 `themeColor`）。整张图成为「彩色星图」。
2. **第二段点亮一眼可辨**：用户去过的坐标在保留子主题色的同时放大（scale ~1.4）+ 持续
   呼吸辉光（drop-shadow pulse），成为「最亮的光点」；第一段坐标降低不透明度作为背景星图。
3. **补充细腻文案与引导**：
   - 「5525 的大船在四年的时间航道里，留下了 {total} 个坐标。」
   - 「其中的 {selected} 个时间坐标，是你曾亲自奔赴过的、最亮的光点。」（selected 随第二段点亮实时递增）
   - 零状态（未选场次）替换为引导选择的文案。
   - 顶部 eyebrow + 图例（三个子主题色 + 「你去过」发光样例）。
4. **整体设计优化**：eyebrow / 标题 / 引导语 / 图例 / 年份分组 / 收尾句的层次与留白。

## 实现

- 组件：`src/pages/summary/cards/SummaryCardOverview.tsx`
  - 新增 `SUB_THEME_COLORS` 与 `getShowColor`，构建 `dateColorMap: Map<date, color>`。
  - block 渲染：第一段 lit 用子主题色 + `fillOpacity 0.62`；第二段 highlighted 用子主题色
    满不透明 + `transform: scale(1.4)`（`transform-box: fill-box`）+ `.overview-dot-lit` 呼吸辉光
    （`--dot-color` 传色）。
  - 顶部 eyebrow `TIMELINE · 时间航道` + 标题；滚动区内引导语（数字 Doto + 辉光，selected 取
    `highlightedDates.size` 实时值）+ 图例；收尾句替换原「N 场属于你」。
- 样式：`src/index.css` 新增 `.overview-dot-lit` + `@keyframes overview-dot-pulse`，
  reduced-motion 下停用动画但保留静态辉光（静态放大仍保证可辨）。

## 验证

- lint / typecheck / `git diff --check`。
- 浏览器走查：彩色星图、选中点放大呼吸、文案数字实时递增、零状态、reduced-motion。
