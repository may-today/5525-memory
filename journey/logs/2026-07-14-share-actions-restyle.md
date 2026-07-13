# /share 操作区按钮改版：深空控制台 + 特别企划入口

日期：2026-07-14

## 需求

1. /share 底部三个按钮与页面深邃感更契合（原为默认 shadcn 白色实心 default + 两个 outline）。
2. 「你的专属报告」应标注为一个特别企划。

## 方案

- 样式集中在 `src/index.css`（`.share-action-primary` / `.share-action-secondary` / `.share-plan-entry`），非分层 CSS 稳定覆盖 Button 变体的 Tailwind hover 工具类（沿用 `.form-show-row` 「背景收进 index.css 管理」的先例，避免 dark: 变体与覆写类的层叠顺序不确定）。
- **保存图片**（主操作）：`#38bdf8` 42% hairline + 12% 星光蓝填充 + `0 0 28px -8px` 外辉光，文字 sky-100；用「发光」而不是「白块」表达主次。
- **将场次保存到...**（次操作）：white/10 hairline + white/4 玻璃填充，zinc-300 文字。
- **你的专属报告**（特别企划）：由普通 outline Button 改为左对齐入口卡（原生 button）：
  - eyebrow `SPECIAL PROJECT · 特别企划`（9px / 0.3em 字距，呼应海报档案眉行）+ 标题「你的专属报告」+ 右箭头（hover 右移 + 提亮）。
  - 签名元素：1px 渐变 hairline 边框，星轨三个子主题色 粉 `#f472b6` → 蓝 `#38bdf8` → 橙 `#fb923c`（padding-box 不透明深底 + border-box 渐变的双背景技法）；内底叠两团极淡角落星云染色。
  - hover 加柔和蓝辉光（box-shadow transition）；`:focus-visible` 用 `var(--ring)` outline。

## 走查

本地 `bun run dev` + Chrome 实机走查（台中 4 场种子数据）：

- 三个入口渲染符合预期，主/次/企划三级层次清晰，tri-color hairline 可辨。
- 特别企划入口点击正确跳转 `/report`；hover 箭头右移生效。
- 「将场次保存到...」Sheet 正常打开（口令 5525-bFw），新类未破坏 SheetTrigger render Button 组合。
- eyebrow 实测宽 186px，320px 窄屏不折行。

改动文件：`src/pages/SharePage.tsx`、`src/index.css`、`journey/design.md`。
