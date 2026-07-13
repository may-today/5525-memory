# 统计页整体样式优化 — 进展（2026-07-13）

计划见 `journey/plans/2026-07-13-summary-style-polish.md`。

## 已完成改动

### 字体
- 8 张卡的左上角标题（引导语）+ 各空态标题 + Duration 的 Sheet 标题统一改用 `font-title`（ChillDINGothic Std），去掉 `font-bold`（交由标题字体自带字重）。
- **移除统计页内全部 `font-wjh`**：City 星轨文案、Duration hero 文案与「分钟」、SongWall 唱片封套标题（封套标题改 `font-title`）。`grep font-wjh src/pages/summary/` 已为空。

### 标题一致性
- 字号统一 `text-xl`（Overview `2xl`→`xl`、Memories `3xl` 两行→`xl` 单行）。
- 位置统一 `px-6 pt-6`；去掉 Overview 的 eyebrow「TIMELINE · 时间航道」；Guests 标题补 `pt-6` 与其余卡对齐。

### 固定标题 + 页内滚动的平滑边界
- 新增 `.summary-scroll-fade-top`（`index.css`）：滚动容器顶部 sticky 渐变遮罩（zinc-950 → 透明），负外边距不占布局。
- 应用于 Overview / SongWall / Playlist / RareSongs 四张「固定标题 + 纵向滚动 + 纯 zinc-950」卡。

### 其他打磨
- City：地球 → 底部信息面板的硬 `border-t` 换成 `.summary-city-panel-fade` 渐变遮罩，面板加 `relative`。

## 校验
- `bunx biome lint`：改动文件（cards + index.css）全部通过；仅 `SummaryContainer.tsx` 两处 **既有** lint（`void`、useEffect deps）未处理，未触碰。
- `tsc -b` 通过。
- dev server 经 curl 确认已服务新代码（`font-title` 存在、eyebrow 已移除）。

## 未决 / 坑
- **浏览器实机截图未能验证**：Claude-in-Chrome 自动化层对 `/src/*.tsx` 模块 URL 有一层强缓存——带唯一 `?t=` 的请求全部返回同一份旧内容（len 47834），甚至在 dev server 已被 kill 后仍能「返回 200」。无 Service Worker / caches。curl（含 `::1`）与磁盘均为新代码。结论：渲染差异来自自动化代理缓存，非代码问题。下次验证建议换真实浏览器手动打开，或重启 Chrome 扩展/清代理缓存。
