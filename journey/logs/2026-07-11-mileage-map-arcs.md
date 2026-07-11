# 日志：城市地图卡奔波距离星轨

日期：2026-07-11 · 计划：`journey/plans/2026-07-11-mileage-map-arcs.md`

## 改动

- `src/server/summary.ts`：起点解析从 `buildMileage` 上移到 handler，`SummaryData` 新增 `travelOrigin: LocationCoordinates | null`。
- `src/pages/summary/cards/SummaryCardCity.tsx`：cobe v2 `arcs` + 每帧球面插值实现弧线生长；出发点蓝色 marker + CSS anchor 脉冲环；初始相机 `phi = 3π/2 − lng`；RAF 时钟驱动文案揭示（与 `isPaused` 协同）；`prefers-reduced-motion` 走静态分支。
- `src/hooks/useSummaryData.ts`：写回 store 时连同 profile 一起写（修复见下）。
- `src/index.css`：`.summary-globe-origin-pulse`、`.summary-globe-travel-copy` 等样式与 reduced-motion 规则。

## 过程与坑

1. **cobe v2 能力确认**：读 `node_modules/cobe/dist` 源码确认 `arcs`（`from`/`to` 均 `[lat, lng]`，全局 `arcColor/arcWidth/arcHeight`）、per-marker `color`、带 `id` 的 marker 暴露 `--cobe-{id}` CSS anchor。弧线不支持部分绘制，用 slerp 推进 `to` 端点做生长动画。
2. **localStorage profile 被清空（预存 bug）**：`useSummaryData` 此前只把 `selectedShows` 写回 store，store 里默认空 profile 被持久化订阅器整体写回 `localStorage`，覆盖掉表单填的城市。表现为文案显示「你从家出发」、二次进入后 `travelOrigin` 变 null。修复：写回时带上解析后的 profile。
3. **phi 公式虚假失败**：验证 `3π/2 − lng` 时恰逢上述 bug 把 travel 打成 null（phi 走 0 分支显示美洲），误以为公式差 180° 改成 `π/2 − lng`；用 cobe anchor div 的 `left` 百分比做精确读数后确认 `3π/2 − lng` 正确（origin 落在 left: 50%），已改回。教训：验证相机角度用 anchor 数值而不是肉眼认大洲。
4. **走查方法**：`.dev.vars` 已把 `STATS_OPEN_AT` 设为过去，门禁开放；localStorage 注入 `concert-form-data:v1`（浙江省 + 北京/武汉/上海各一场，show id 139/122/106），`window.dispatchEvent(new KeyboardEvent(...))` 比合成按键可靠。里程实测 3,704 km，与杭州往返三城的 Haversine 手算吻合。

## 追加：全巡演城市标注（同日）

- `cityMarkers` 改为始终返回全部非隐藏场次城市（首次出现顺序），新增 `isVisited` 标记；前端去过的城市用大号蓝点 + 白标签 + 蓝色光点前缀，未去过的小号灰点 + 暗标签；弧线目标只取 `isVisited`；初始聚焦第一座去过的城市。
- 走查时 localStorage 出现真实用户数据（13 场、含海外城市），一度误判为高亮 bug——实为正确结果，顺带验证了跨太平洋长弧（拉斯维加斯）与 23 城全标注（里程 67,534 km）。注意：测试期间我覆盖过本机 localStorage 的 `profile.city`（写成了浙江省），真实用户数据可能受影响。

## 追加：移除弧线生长动画（同日）

- 产品决定去掉弧线逐条展开的动画：删除 slerp/缓动/`computeArcFrame` 与相关时序常量，`arcs` 在 `createGlobe` 时即完整传入，RAF 里不再每帧更新弧线缓冲。
- 保留：出发点脉冲环、初始相机对准、文案淡入（RAF 时钟改为固定 600ms 延迟，仍只在未暂停时推进，避免切页中途淡入）。

## 追加：城市胶片条联动，去掉球面标签（同日）

- 全城市标注后国内标签严重重叠；给出多方案对比后选定「胶片条联动」：地球上不放任何文字（只留灰点/蓝点/星轨），底部改为横向滚动的城市胶片条（去过=白字+蓝点前缀，激活=深底+亮边框），点选后胶片平滑滚至中央、地球沿最短角路径缓动转向该城市（0.08/帧缓动 + 0.004 rad 吸附后恢复自转）。
- 无星轨时初始相机也改为对准初始聚焦城市（此前为 phi=0 的任意视角）；城市 marker 不再传 id，省掉 23 个逐帧更新的 anchor div。左右按钮与大标题移除，当前城市名并入经纬度行。
- 走查：胶片条自动定位到北京（04/23）、点悉尼地球东转（12/23，02/22 Day1）、点台中显示「—」，均符合预期。

## 验证结果

- 多城市分支：初始对准出发点、脉冲环、三条弧线错峰生长、文案两行（浙江 + 3,704 蓝色 Doto）✓
- 无地点分支（不透露）：无 copy/pulse/origin marker，卡片与原版一致 ✓
- `bun run typecheck` ✓；biome 仅剩改动前既有的基线提示 ✓
