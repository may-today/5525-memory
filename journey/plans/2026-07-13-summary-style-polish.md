# 统计页整体样式优化（2026-07-13）

## 目标
对 `/summary` 全部 8 张统计卡做统一的前端样式打磨，使界面更优雅精致、风格一致。

## 决策

### 1. 字体
- 每张卡左上角**标题（引导语）**统一用 `font-title`（ChillDINGothic Std）。
- 小字/正文保留默认 sans（Doto/WJH 仅用于数字与既有装饰，不动数字用的 `font-geist`）。
- **统计页内部移除全部 `font-wjh`**：
  - City 星轨文案 `.summary-travel-line`
  - Duration hero 文案与「分钟」
  - SongWall 唱片封套标题
  - Memories 引号装饰 `font-title` 保留（属标题字体，非 wjh）。

### 2. 标题一致性
- 字号统一 `text-xl`（Overview `2xl`→`xl`，Memories `3xl`→`xl`）。
- 位置统一 `px-6 pt-6`，去掉 Overview 的 eyebrow（其余卡均无 eyebrow）。
- 去掉 `font-bold`，交由 `font-title` 自带字重（与既有 hero 曲名一致）。

### 3. 固定标题 + 页内滚动的平滑边界
适用于「顶部固定标题 + 下方纵向滚动」且纯 `bg-zinc-950` 的卡：
Overview / SongWall / Playlist / RareSongs。
- 在滚动容器顶部加一个 `sticky top-0` 的渐变遮罩 `.summary-scroll-fade-top`
  （zinc-950 → 透明），让上滑内容在标题下自然淡出，消除硬边界。

### 4. 其他打磨
- City：地球 → 底部信息面板的硬 `border-t` 用渐变遮罩柔化。
- 正文统一 `text-sm text-zinc-400 leading-relaxed`。

## 验证
用 `verify` skill 在真机浏览器逐卡检查（字号、标题位置、渐变过渡）。
