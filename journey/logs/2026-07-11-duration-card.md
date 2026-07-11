# 时长统计卡实施日志（2026-07-11）

按 `journey/plans/2026-07-11-duration-card.md` 实施,全部完成。

## 数据调查

- D1 无时长字段;`shows.show_start_time` / `show_end_time`（"HH:MM"）163 场中 137 场齐全,平均 190.7 分钟(min 75 / max 252)。缺数据 26 场;跨夜 3 场,全部为跨年场(如台中 2025-12-31 `21:28 → 0:44`,注意单数字小时格式)。
- 产品口径由用户拍板:缺数据场按 180 分钟计入总数,但不进每场列表(区别于最初提案的「平均值估算 + 约字标记」)。

## 实施

- `src/server/summary.ts`:`DurationShowEntry` / `DurationStats` + `parseClockMinutes`(顶层正则,防 NaN)/ `getShowDurationMinutes`(跨夜 +1440、(0,480] 护栏)/ `buildDurationStats`;`SummaryData.durationStats`。
- `src/pages/summary/summary-card-props.ts`:共享 `SummaryCardProps`,`SummaryContainer` 移除 `cardIndex === 1` 特判改为统一 `<Card isPaused={...} />`;`SummaryCardDuration` 插入 index 1。
- `src/pages/summary/cards/duration-hourglass.ts`:Canvas 2D 粒子引擎(500–1800 粒子、DPR≤1.5、预渲染光斑 sprite、`lighter` 混合、汇聚段拖尾 ghost);粒子位置为平滑进度的纯函数,scrub 可逆。
- `src/pages/summary/cards/SummaryCardDuration.tsx`:sticky hero + 280svh 跑道 + 点线引导列表 + 零状态 + reduced-motion(静态帧 + 数字直显 + 跑道收缩)。
- `src/index.css`:`.summary-duration-hero-copy` / `.summary-duration-number` + reduced-motion 块追加。

## 过程中的问题与修正

- **rAF 节流暴露的缓动缺陷**:headless 走查时 Chrome 窗口被遮挡(`visibilityState: hidden`),rAF 节流到 ~1fps,固定的每帧 8% 缓动导致进度永远追不上滚动。改为时间基缓动(`1 - 0.92^(delta/16.7)`),顺带保证 60/120Hz 显示器手感一致。这是正式改进,不只是测试补丁。
- 引擎与卡片过 ultracite 时拆出 `getSettledPosition` / `applyConvergence` / `scanLitPixels` 纯函数(降 cognitive complexity),顺带更可测。

## 走查结果(本地 dev,headless Chrome)

- 多场分支(北京 139/140 + 台中跨夜 21 + 悉尼缺数据 97):hero 数字 **736 分钟** = 180+180+196+180 ✓;列表 3 行(缺数据场排除)✓;注脚「另有 1 场未记录…按 180 分钟计入」✓;合计行 736 分钟 ≈ 12 小时 ✓。
- 沙漏三阶段(静止/流动/汇聚)与 DOM 数字交接均正常;粒子拼出 Doto 点阵数字后淡出交接。
- City 卡在新 index 2 下回归正常(星轨、里程文案、胶片条)。
- 零状态:静止沙漏 + 「沙漏还没有开始计时」文案,无滚动跑道。
- typecheck 与 ultracite 通过(仓库原有的 kibo-ui / SummaryCardOverview 遗留告警除外)。

## 遗留

- reduced-motion 分支未在真实系统设置下走查(代码路径与 City 卡同模式);280svh 跑道与缓动系数待真机(iOS Safari)调参。
