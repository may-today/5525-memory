# 计划：城市地图卡展示奔波距离（蓝色星轨）

日期：2026-07-11

## 目标

`getSummaryData` 已返回 `mileage`（用户到各去过城市的往返公里数之和），前端尚未展示。本次在 `/summary` 的城市地图卡（`SummaryCardCity`）上做叙事化展示：

- 卡片挂载时地球先定位到用户所在坐标，用户位置出现一个蓝色脉冲光点（「发射电波」）。
- 蓝色弧线（流星轨）从用户位置逐条生长，跨越 3D 地球连接到每一座去过的演唱会城市。
- 文案缓缓浮现：
  - 「那一天，你从{A}出发，跨越了 {X,XXX} 公里，只为了奔赴那一角蓝色的海。」
  - 「你走过的所有路，都变成了舞台上亮起的逆风光。」
- 多城市时多条弧线以用户为中心自然交织成「引力场」，脉冲光点循环呼吸强化该意象。

## 关键技术事实（已验证）

- 项目使用 **cobe v2.0.1**，v2 原生支持弧线：`arcs: { from: [lat, lng]; to: [lat, lng]; color? }[]`，另有全局 `arcColor` / `arcWidth` / `arcHeight`；`globe.update({ arcs })` 每帧可改，坐标约定与 marker 一致（`[lat, lng]`）。
- cobe 会为带 `id` 的 marker 暴露 CSS anchor（`--cobe-{id}` / `--cobe-visible-{id}`），现有城市标签就靠它定位——用户位置的 DOM 脉冲光点可用同一机制锚定。
- 让某坐标正对镜头的相机角度：`phi = 3π/2 − lng·π/180`（与 cobe 官方 focus 示例一致），`theta` 维持现值 0.2。
- 弧线「生长」动画：cobe 不支持部分弧线，改为每帧用球面插值（slerp）把 `to` 从起点推向目标城市，在现有 RAF 循环里 `globe.update({ phi, arcs })`。

## 数据流

- **服务端**（`src/server/summary.ts`）：`buildMileage` 内部已有起点解析（浏览器坐标优先，回退所选城市/地区中心 `geoCoordMap`）。把起点解析提到 handler 层，`SummaryData` 新增 `travelOrigin: LocationCoordinates | null`（与 `mileage` 同为 null 当无可用地点）。
- **前端**：弧线目标 = `cityMarkers`（仅当 `selectedShows.length > 0`，否则 cityMarkers 是全巡演兜底城市，不能画）。出发城市名 A 来自 `concertStore.profile.city`，展示时去掉「市/省/自治区/特别行政区」等后缀；city 为空、「不透露」或「其他国家或地区」时文案退化为「你从家出发」。
- **启用条件**（全部满足才进入星轨叙事，否则卡片行为与现状完全一致）：`travelOrigin != null` 且 `mileage != null && mileage > 0` 且 `selectedShows.length > 0` 且 cityMarkers 非空。

## 视觉与动效

- 蓝色是本卡唯一的强调色（呼应「蓝色的海」= 五月天蓝色海洋）：`#38bdf8`，arcColor `[0.22, 0.74, 0.97]`。
- 时序（挂载起算）：0s 相机对准用户坐标 + 蓝色 marker + DOM 脉冲环开始循环 → ~0.8s 弧线按城市逐条错峰生长（每条 ~1.4s，间隔 ~0.25s，ease-out）→ 全部完成后弧线常驻 → 文案两行先后淡入（CSS delay 按弧线时序推算）。地球自转照常（弧线随球体旋转）。
- 文案叠加在地球区域上方（eyebrow 之下），`pointer-events-none`；公里数用 Doto 点阵体 + 蓝色辉光，句子用 WJH。数字用 `toLocaleString('en-US')` 千分位，SSR/CSR 确定性一致（该卡数据本就是客户端获取，风险低）。
- 切页暂停（`isPaused`）沿用现状：RAF 里不推进 phi 时也不推进弧线动画进度（用时间累计而非墙钟，避免暂停期间跳变）。
- `prefers-reduced-motion`：弧线直接以完整形态渲染、脉冲静止、文案不做延迟淡入。

## 改动文件

1. `src/server/summary.ts` — `SummaryData.travelOrigin` + 起点解析上移。
2. `src/pages/summary/cards/SummaryCardCity.tsx` — 起点 marker、弧线生长动画、初始相机角、文案 overlay。
3. `src/index.css` — 脉冲环、文案淡入样式。
4. `journey/design.md` — 城市地图卡章节 + 待办项收尾。

## 验证

- `bun run typecheck` + `bun run lint`。
- `bun run dev` + Chrome 走查：localStorage 注入含坐标/城市与场次的表单数据，检查弧线时序、文案、多城市交织、无地点时零回退。
