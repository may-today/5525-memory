# 岁月音乐墙 · 唱片抽出详情交互

## 目标

点击唱片架上的任意唱片脊线，唱片从架上「抽出」飞到画面中央展开成完整封套，
展示这首歌的基础信息（专辑/年份）、全巡演唱过的场次列表（用户在场的高亮）、
以及由数据生成的「相遇故事」文案。关闭后唱片飞回架上原位。

## 动效方案（不引入 GSAP）

项目动画全部基于 CSS / compositor-only transform，这里用 **WAAPI（`element.animate`）做一次 FLIP**：

1. 点击脊线 button 时捕获其 `getBoundingClientRect()`；原脊线置 `visibility: hidden`，架上留出空槽（唱片被取走的实感）。
2. 覆盖层（`fixed inset-0`，带 `data-summary-gesture-exempt` 免疫切页手势）挂载后，
   封套元素量出终点 rect，从「平移到脊线中心 + 非均匀缩放到脊线尺寸」动画到 `transform: none`
   （0.52s，`cubic-bezier(0.22, 1, 0.36, 1)`）。飞行期间封套内容与黑胶盘隐藏，落定后内容淡入、黑胶盘从封套上沿探出。
3. 关闭（点背景 / Esc / 「放回架上」按钮）：内容淡出，封套反向 FLIP 回脊线 rect，结束后卸载覆盖层、脊线恢复可见。
4. `prefers-reduced-motion`：跳过 FLIP 与探盘动画，覆盖层直接淡入淡出、内容立即可见。

## 数据

- `ShelfSong` 扩展：挂上 `tourSong: TourSong | null`（unsung 为 null）与曲库 `album` / `year`。
- **服务端小改**：`SummaryShowInfo` 增加 `showDate`（YYYY-MM-DD）——巡演横跨 2023–2026，
  场次列表与「第一次相遇」文案需要年份；`toSummaryShowInfo` 直接带出 `show.showDate`。
- 相遇故事口径：
  - 听过：取 `appearances` 中第一条 `isHeard`（天然日期升序）→「YYYY.MM.DD 的{城市}，你们第一次在现场相遇」，多次追加「之后又重逢了 N 次」。
  - 唱过没赶上：「全巡演它响起过 N 次，只是你们还没有在现场遇上」。
  - 全巡演未唱：「这一轮巡演，它一直安静地躺在架上，没有被唱起」。
- 场次行：`showDate`（font-geist）+ 城市 + dayLabel；`request`/`encore` 段落加「点歌」/「安可」小徽章；
  用户在场的行用本卡专属色（紫 `--wall-color`，曲库外用金 `--wall-gold`）高亮 + 「你在场」标记。

## 视觉

- 封套：正方形（`min(64vw, 230px)`），配色沿用脊线五种状态的渐变家族（紫亮/暖褐/冷灰/金亮/暗金），
  FLIP 起点是脊线本体，飞行过程渐变连续、观感即「唱片被放大」。
- 黑胶盘：纯 CSS（`repeating-radial-gradient` 沟槽 + 状态色圆标），落定后 `translateY` 从封套后探出。
- 布局：上半区居中封套 + 探盘；下半区信息面板——故事文案、场次列表（`max-h` 内滚 + `overscroll-contain`）、放回提示。

## 文件

- `src/server/summary.ts`：`SummaryShowInfo` + `showDate`。
- `src/pages/summary/cards/SummaryCardSongWall.tsx`：脊线改 button、taken 状态、覆盖层组件（同文件内 `RecordDetailOverlay`）。
- `src/index.css`：`summary-record-*` 样式与 reduced-motion 清单。
- `journey/design.md`：第 4 张卡的交互描述更新。
