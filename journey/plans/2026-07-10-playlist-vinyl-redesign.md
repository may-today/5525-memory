# 专属歌单卡视觉重设计：时光黑胶（SummaryCardPlaylist v2）

## 背景与目标

第一版专属歌单卡（见 `2026-07-10-exclusive-playlist-card.md`）用「hero 歌名 + 排行条」呈现随机曲目统计，用户反馈**更像数据报告而不是精致的回忆**。本次重设计采纳用户提出的「时光黑胶」意象：

- 一张旋转中的黑胶唱片作为卡片的签名元素（signature element）。
- 歌曲名在唱片一旁逐一浮现，每首歌标注在用户观演场次中的出现次数。
- 整体气质从「图表」转向「实体唱片纪念品」。

## 设计方案

### 布局（移动端优先，纵向滚动）

```text
04 / 专属歌单
点歌与安可，替你压成一张时光黑胶。      ← 眉标 + 标题（shrink-0）
────────────────────────────────
        ╭──────────╮
        │ ◉ 黑胶唱片 │              ← 居中旋转唱片（签名元素）
        ╰──────────╯
        你的常驻曲
        《突然好想你》               ← WJH + 品牌橙辉光（保留 v1 hero 手法）
        在你去过的 N 场里……出现 Z 次   ← 统计文案（保留 v1 口径句式）

  SIDE A · 出现次数 TOP 10
  A1 突然好想你 ··········· ×6      ← 唱片封底 tracklist：曲序 A1–A10 +
  A2 温柔 ················· ×5         点线引导（dot leader）+ ×N 计数
  ……
  随机曲目从不彩排重逢……              ← 收尾句 + 口径注脚（不变）
```

### 唱片构成（纯 CSS/SVG，compositor-only）

- **旋转层 `.summary-vinyl-disc`**：`repeating-radial-gradient` 沟槽纹 + 几圈更亮的「分轨环」；环绕橙色圆标外侧一圈 SVG `textPath` 蚀刻文字（`MAYDAY #5525 · SIDE A · MEMORY PRESS`），旋转的环形文字是「唱片在转」的主要视觉证据（沟槽本身旋转对称，转起来不可见）。`animation: rotate 12s linear infinite`（真实 33⅓ 转/分太快易晕）。
- **圆标 `.summary-vinyl-label`**：品牌橙 radial 渐变纸标 + 中心孔，随盘旋转。
- **静止高光层 `.summary-vinyl-sheen`**：conic-gradient 双侧柔光 + 顶部环境光，模拟固定光源——光不随盘转，物理正确。
- 唱片下方品牌橙 box-shadow 弥散光，让「黑盘浮在深色底上」。

### 排行呈现：从 bar chart 改为唱片封底 tracklist

- 删除排行条（`.summary-playlist-bar`），改为专辑封底排版：曲序 `A1`–`A10`（Doto）+ 歌名 + 点线引导 + `×N` 次数（Doto）。
- 第一名歌名保持白色加粗，其余 zinc-300；次数统一文本色（zinc-100），不再用序列色——脱离图表语义后，dataviz 单序列规范让位于版式一致性，品牌橙集中在圆标与 hero 辉光上（深色面对比度已在 v1 校验）。
- 平票排序、Top 10、口径注脚、零状态文案、`data-scroll-container` 滚动优先逻辑全部沿用 v1，服务端无改动。

### 动画与可访问性

- 唱片入场：wrapper 淡入 + 轻微 scale（旋转在内层，互不干扰）；tracklist 沿用逐行错峰淡入上移（`playlist-row-in`）。
- `prefers-reduced-motion`：停转、停入场、停逐行动画（更新 index.css 现有 reduced-motion 块，移除已删除的 `.summary-playlist-bar`）。

## 改动范围

- `src/pages/summary/cards/SummaryCardPlaylist.tsx`：重写视觉结构（新增 VinylDisc、TrackRow）。
- `src/index.css`：删除 `.summary-playlist-bar*`，新增 `.summary-vinyl*` 样式与 `vinyl-spin` 关键帧。
- 无服务端 / 数据改动。

## 曾考虑并放弃的方案

- **唱臂（tonearm）**：加一支唱臂更「播放器」，但小屏上挤占宽度且喧宾夺主，删。
- **歌名逐首轮播浮现**（一次只显示一首）：更贴近「浮现」字面，但隐藏了排行全貌，与 Top 10 数据目标冲突。
- **常驻曲名印在圆标上**：随盘旋转的中文歌名不可读；改为圆标只承担环形蚀刻文字，歌名以静态 hero 形式出现在唱片下方。

## 验证

- `bun run typecheck` + `bun run lint`。
- `bun run dev` + 浏览器走查 `/form → /summary` 第 4 卡：旋转、辉光、tracklist、滚动切页、reduced-motion。
