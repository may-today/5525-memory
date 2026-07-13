# 四季歌单卡重设计：四季光场

日期：2026-07-14

## 背景与目标

`SummaryCardSeasonalPlaylist` 目前是展示骨架：四个描边小盒子按 `randomSongStats.entries`
顺序填占位歌名，既没有真实的季节聚合，也没有视觉设计。本次目标：

1. 服务端补上「每季出现次数最高的随机曲目」聚合，替换占位数据。
2. 界面按用户给出的意象重做：**四个象限还原为季节的颜色，用干净优雅的渐变体现，
   歌名恰好嵌在其中**。关键词：简洁、优雅、有呼吸感。

## 视觉方案：四季光场（签名元素）

整页不是四张「卡片」，而是一块深色画布（`zinc-950`）上四片从**屏幕四角**晕开的
季节光场。每片光场是一个锚定在所属象限外角的 radial-gradient，向屏幕中心衰减为
透明——中心始终保持安静的深色，这块「留白的暗」就是呼吸感的来源。象限之间不画
边框、不加圆角盒子，四片颜色相遇的地方自然形成边界。

象限按**顺时针 = 一年四季的循环**排布（结构编码真实信息）：

```text
┌────────────────────────────┐
│ 你的四季歌单（eyebrow）      │
│ 每一个季节，都有一首歌…      │
│                            │
│ ◤春·粉          夏·青碧 ◥  │
│   歌名             歌名     │
│   ×N                ×N     │
│          （暗心）           │
│ ◣冬·蓝紫        秋·琥珀 ◢  │
│   歌名             歌名     │
│                            │
│ 口径注脚                    │
└────────────────────────────┘
```

- 左上=春、右上=夏、右下=秋、左下=冬；光场各自锚定在外角，整页读作一圈「年轮」。
- 文字对齐跟随外角：左列左对齐、右列右对齐，歌名「嵌」在光场最亮处。

### 季节色（本卡专属四色系统）

| 季节 | 月份 | 色 | 意象 |
| ---- | ---- | --- | ---- |
| 春 | 3–5 | `#fda4af`（樱粉） | 樱花 |
| 夏 | 6–8 | `#5eead4`（海青） | 盛夏的海 |
| 秋 | 9–11 | `#fbbf24`（琥珀） | 落叶灯光 |
| 冬 | 12–2 | `#a5b4fc`（冬夜蓝紫） | 冷空气与星 |

与既有卡片强调色（sky 蓝、音乐墙紫 `#a78bfa`、黑胶橙 `#f97316`、惊喜金 `#d9a441`、
5525 粉 `#f472b6`）保持可区分；光场透明度压得很低（峰值 ~22%），四色同屏不吵。

### 每格内容（自外角向内）

1. 季节字「春」：font-title，季节色，中号——是标签不是装饰大字。
2. 月份小注 `3 – 5 月`：font-geist，zinc-500 级别。
3. 歌名：font-title 白色（本格的绝对主角），长歌名允许两行。
4. 次数 `×N`：font-geist，季节色淡染。
5. 空季节：安静的一行 zinc-600「这个季节，你还没有出发」。

### 动画

- 入场：四片光场按春→夏→秋→冬顺时针错峰淡入（≈150ms 间隔），歌名随后淡入上移。
- 常驻：光场极缓慢呼吸（opacity 0.8↔1，12s+，逐季错峰）。全部 opacity/transform，
  compositor-only，不需要 `isPaused`。
- `prefers-reduced-motion`：全部停用，静态呈现终态。

### 交互

一屏四宫格，无页内滚动（维持现状，不加 `data-scroll-container`）。不加点击态——
这张卡是一张安静的海报，克制即设计。

## 数据方案

### 服务端（`src/server/summary.ts`）

新增 `SeasonalSongStats`，进 `SummaryData`：

```ts
export interface SeasonalSongEntry {
  /** 该季用户听过次数最多的随机曲目；该季没有随机曲目记录时为 null。 */
  song: { count: number; title: string } | null
  /** 用户选中场次中落在该季的场次数。 */
  showCount: number
}

export interface SeasonalSongStats {
  /** 固定按春(3–5)、夏(6–8)、秋(9–11)、冬(12–2) 顺序的四个条目。 */
  seasons: [SeasonalSongEntry, SeasonalSongEntry, SeasonalSongEntry, SeasonalSongEntry]
}
```

- 口径与专属歌单一致：`isRandomSong`（request/encore + 主题固定曲黑名单）。
- 季节划分与报告页 `report-stats.ts` 一致：春 3–5、夏 6–8、秋 9–11、冬 12–2。
- 每季按出现次数降序、平票按 `compareTitles` 排序取第一，保证 SSR 确定性。
- 复用 `selectedSetlistItems` 内存快照，不新增 D1 查询。

### 客户端

卡片改读 `seasonalSongStats`；零状态维持现有两分支文案（未选场次 / 无点歌安可记录）。

## 验收

- `bun run check`（或项目等价 lint/typecheck）通过。
- 用 verify skill 浏览器走查：有数据、单季空缺、全零状态三分支 + reduced-motion。
- 更新 `journey/design.md` 第 8 节。
