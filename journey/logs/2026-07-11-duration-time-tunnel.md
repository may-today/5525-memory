# 时长统计卡「时光隧道」重设计 · 过程记录

计划见 `journey/plans/2026-07-11-duration-time-tunnel.md`。

## 完成内容

- 删除 `duration-hourglass.ts`，新建 `duration-tunnel.ts`：粒子改为隧道柱面模型（环向角 + 半径抖动 + 循环纵深），透视投影 + 滚动驱动 2.4 圈穿越飞行 + warp 拉线 ghost + 聚合成数字点云。保留旧引擎的全部硬约束：位置是 (progress, time) 的纯函数、DPR ≤ 1.5、sprite 发光、`lighter` 混合、isPaused / destroy、handoff 滞回、数字点云 Doto 采样与 DOM bbox 拟合。
- 数字格式：`String(totalMinutes)`，粒子采样与 DOM 展示均去掉千位逗号。
- 新增引擎回调 `onIntroChange`（滞回 0.12/0.08）：顶部引导语随飞行启程淡出、滚回淡入（`.summary-duration-intro`；reduced-motion 下 transition 关闭、保持可见）。
- 文案全部换为时光机/列车意象（引导语、聚字文案、零状态、列表收尾句），详见计划文件。
- `journey/design.md` §2 已同步。

## 验证

- `tsc -b` 与 biome 通过。
- 本地 dev + Chrome 走查（台中 266–269 四场 = 740 分钟）：静止隧道漂移、引导语淡出、飞行 warp、粒子聚成点阵「740」、DOM 数字交接、倒滚倒放、零状态（「时光机还停在原地」）均正常，无 console 错误。
- 跨夜/缺数据的服务端口径本次未改动，沿用前版验证结论。

## 备注

- 消失点位于画面 42% 高度，数字文案块仍在 58%，二者不冲突。
- 走查时改写过本地 localhost 的 `concert-form-data:v1`（现留有台中 4 场的测试数据）。
