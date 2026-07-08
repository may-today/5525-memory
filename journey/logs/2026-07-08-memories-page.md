# 你的回忆统计页 — 实施日志

日期：2026-07-08 ｜ 计划：`journey/plans/2026-07-08-memories-page.md`

## 完成内容

- 新增 `src/pages/summary/cards/SummaryCardMemories.tsx`：长列表视差滚动的回忆长廊，每条含大号主题色日期、城市/场馆/场次标签、照片占位框（配 caption）、talking 长文字占位、幽灵序号与主题色辉光。
- `src/index.css` 新增 `.summary-memory-*` 样式（视差层、占位图渐变 + 扫光、引用符等）及 reduced-motion 覆盖。
- `SummaryContainer` 的 CARDS 追加为第 7 张（编号 `05 / 你的回忆`），位于嘉宾星球之后、作为最后一页承接「生成总结」按钮。
- 更新 `journey/design.md` 新增「8. 你的回忆」章节。

## 关键实现说明

- 视差没有用 CSS scroll-driven animations（Safari 覆盖不稳），用滚动容器 scroll 事件 + rAF 节流写 `--parallax`（条目中心相对视口中心的进度，clamp 到 [-1,1]），各层用不同系数 translateY，全部 transform-only。
- 滚动容器加 `overflow-x-hidden`，防止横向溢出的辉光层撑出横向滚动条。
- 照片框的倾斜（rotate）放在内层 frame 而不是视差层，避免和视差 transform 互相覆盖。
- 零状态：未选场次时取 `allShows` 前 3 场作示例并标注「示例」徽标。

## 验证

- `bun run build`（vite build + tsc）通过；`ultracite check` 改动文件无错误；dev server 下 `/summary` SSR 返回 200。
- 视差滚动的实际手感未在真实设备上验证，待人工体验调参（系数常量都在 CSS 里，易调）。
