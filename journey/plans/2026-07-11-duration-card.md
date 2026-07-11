# 时长统计卡「蓝色星轨沙漏」

## 目标

在 `/summary` 的巡演时间轴卡(SummaryCardOverview)之后插入「时长统计」卡 `SummaryCardDuration`:

- 服务端 `getSummaryData` 新增 `durationStats`(总分钟数 + 每场时长列表)。
- 卡片视觉意象为「蓝色星轨沙漏」:荧光蓝(`#38bdf8`,与城市卡星轨同色)Canvas 2D 粒子组成的沙漏,随卡片内部滚动,粒子从静止 → 流动 → 汇聚成总分钟数,文案「在 5525 的时空里,你与五月天一起狂欢了 XX 分钟」。
- 顺带把 `SummaryContainer` 的 `isPaused` 从「index === 1 特判」泛化为统一的 `SummaryCardProps`。

## 数据口径

- 时长 = `showEndTime - showStartTime`(HH:MM 差值);`diff <= 0` 视为跨夜 `+1440`;结果不在 `(0, 480]` 分钟区间时视为脏数据,按缺失处理。163 场里 137 场两者齐全(min 75 / max 252 / 均值 ~191 分钟)。
- **缺失兜底(产品决策)**:缺开/散场时间的选中场次按 **180 分钟** 计入总分钟数(`FALLBACK_SHOW_MINUTES`),但**不进**每场时长列表,由注脚说明(`fallbackCount`)。
- 零状态:未选场次 → `entries: []`、`totalMinutes: 0`,卡片渲染静止沙漏 + 引导文案。

## 关键决策

- **Canvas 2D 而非 WebGL**:~1400 个粒子(按面积缩放,上限 1800)2D 足够;发光用预渲染的 radial-gradient 光斑离屏 sprite + `drawImage`,不用逐粒子 `shadowBlur`(极慢)。DPR 上限 1.5、卸载即停 RAF、切页 `isPaused` 冻结,全部沿用城市卡先例。
- **滚动 scrub 驱动**:sticky hero + 280svh 滚动跑道;滚动进度写 ref,主循环每帧 `progress += (target - progress) * 0.08` 缓动追踪——平滑且可逆(回滚即倒放)。粒子位置是 progress 的纯函数(无累积状态),天然支持任意方向 scrub。
- **粒子拼数字最终交接 DOM 文本**:数字点云由离屏 canvas `fillText` + `getImageData` 采样(须等 `document.fonts.load` 的 Doto 就绪);`p ≥ 0.94` 粒子淡出、真实 DOM 数字(`.font-geist` + 蓝辉光)淡入——最终帧锐利、可访问、reduced-motion 有现成静态形态。
- **isPaused 泛化**:新建 `summary-card-props.ts` 共享 `SummaryCardProps`(独立文件避免 Container ↔ 卡片循环依赖),`CARDS` 数组统一 `<Card isPaused={...} />`。

## 实施步骤

1. `src/server/summary.ts`:`DurationShowEntry` / `DurationStats` 类型 + `parseClockMinutes` / `getShowDurationMinutes` / `buildDurationStats`,`SummaryData` 加 `durationStats` 字段。
2. `src/pages/summary/summary-card-props.ts` 新建;`SummaryContainer.tsx` 插卡 + 泛化;`SummaryCardCity.tsx` 改用共享 props。
3. `src/pages/summary/cards/duration-hourglass.ts` 粒子引擎(纯 TS,无 React);`SummaryCardDuration.tsx` 卡片(hero + 每场时长列表,列表复用黑胶卡点线引导排版)。
4. `src/index.css`:`.summary-duration-*` 类分组 + reduced-motion 块追加。
5. `journey/design.md` 统计页面章节插入新小节、原 2–6 顺延。

## 验证

- 本地 D1 查缺数据场次与跨夜场次 id;`bun run dev` 走查多场(含缺数据 + 跨夜)/单场/零状态三分支;交互回归(滚动优先切页、切页冻结、City 卡新索引);reduced-motion 模拟;typecheck + biome。
