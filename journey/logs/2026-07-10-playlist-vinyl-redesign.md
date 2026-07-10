# 专属歌单卡「时光黑胶」重设计 · 过程日志

## 背景

用户反馈第一版专属歌单卡（排行条版）「更像数据报告而不是精致的回忆」，并提出「时光黑胶」方向：旋转唱片 + 一旁浮现歌曲名 + 每首标注出现次数。方案定稿见 `journey/plans/2026-07-10-playlist-vinyl-redesign.md`。

## 关键实现点

- 旋转的可见性：黑胶沟槽是旋转对称的，光转盘面看不出动；解法是在圆标外圈加一圈随盘旋转的 SVG `textPath` 蚀刻文字。截图验证时正好捕到文字处于旋转中间相位，确认生效。
- 光照正确性：高光层（conic-gradient 双侧柔光）作为独立静止层叠在旋转盘面之上，模拟固定光源。
- 排行从 bar chart 改为专辑封底 tracklist：`A1`–`A10` 曲序（Doto）+ 点线引导（`border-b border-dotted` 空 flex 元素，baseline 对齐）+ `×N` 次数；删除 `.summary-playlist-bar*` 样式。
- 蚀刻文字排满圆周靠字数与 `letter-spacing: 0.14em` 手动配平（radius 23 / viewBox 100 / fontSize 4.2 / 57 字符），Doto 无 CJK，蚀刻文案只用拉丁字符。
- reduced-motion 块同步更新：`.summary-vinyl`（入场）与 `.summary-vinyl-disc`（旋转）停用。

## 验证

- `bun run typecheck`、`bun run lint` 通过（SVG 需 `aria-hidden` + `role="presentation"` 过 biome a11y 规则）。
- Chrome 扩展未连接，改用 playwright-core（`channel: 'chrome'` 无头）+ 本地 D1 数据截图走查：390×844 视口，注入 `concert-form-data:v1`（showIds [2,3,6,9,11]），键盘切页到第 6 卡。hero、tracklist、唱片放大图均符合预期。

## 发现的数据问题（未处理）

- D1 中部分曲名自带 emoji 后缀（如「最好的一天 🦖」「第一天 💠」），且「第一天」以两种变体分别计数出现在榜单 A6/A10。如果这些 emoji 是场次特别版标记，排行是否应合并同名曲需要另行决定。
