# 岁月音乐墙 · 唱片抽出详情交互 · 实施日志

计划：`journey/plans/2026-07-13-songwall-record-detail.md`

## 实施

- `src/server/summary.ts`：`SummaryShowInfo` 增加 `showDate`（YYYY-MM-DD），`toSummaryShowInfo` 带出；巡演跨 2023–2026，详情场次列表与「第一次相遇」文案需要年份。
- `src/pages/summary/cards/SummaryCardSongWall.tsx`：
  - `ShelfSong` 挂上 `tourSong`（unsung 为 null）与曲库 `album`/`year`；脊线由 span 改为 button，点击时捕获 `getBoundingClientRect` 交给覆盖层，被抽走的脊线 `visibility: hidden` 留空槽。
  - 新增 `RecordDetailOverlay`：WAAPI FLIP 开合（不引 GSAP，项目动画惯例是 CSS/compositor-only，这里只补一次性位移）、黑胶盘探出、相遇故事（`EncounterStory`）、全部 appearances 列表（isHeard 行高亮 + 你在场标记 + 点歌/安可徽章）、Esc/背景/按钮三种关闭。
- `src/index.css`：`summary-record-*` 样式族（backdrop、stage、disc、五种状态封套、信息面板、场次行、徽章）+ reduced-motion 清单补充。

## 走查（Chrome + 本地 D1，4 场台中选中）

- 紫色听过（倔强）：FLIP 飞出、盘探出、故事「2023.12.31 的台中…重逢了 3 次」、4/156 场次高亮正确。
- 暗褐未听（摩托车日记）：0/4、点歌徽章、「还没有在现场遇上」。
- 冷灰未唱（时光机）：无场次列表、「没有被唱起」。
- 金色曲库外（我不愿让你一个人+诺亚方舟）：金封套、1/1 金色你在场。
- 关闭后脊线恢复、Esc / 背景 / 按钮三路都通。

## 踩坑：隐藏文档不派发 WAAPI finish 事件

走查中标签页转入后台（`document.hidden = true`）后，中途关闭的覆盖层永久卡死：Chrome 把动画事件派发绑在渲染机会上，隐藏文档里 `onfinish` 不触发、`finished` promise 也不 resolve（最小复现确认，非本项目代码问题）。真实用户在飞行动画中途切走标签页会命中同样路径。

修复：`settleAnimation(animation, timeoutMs, callback)` —— onfinish 与「略超时长的 setTimeout」双保险，callback 幂等只跑一次；开卡的 `setIsSettled` 与关卡的 `onClose` 都走它。后台标签页 setTimeout 会被节流到 ≥1s，但只影响不可见时的状态转移时机，可接受。修复后在隐藏标签页下复测中途打断与正常开合均通过。
