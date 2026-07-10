# 预热页与限时开放门禁 · 过程日志

对应计划：`journey/plans/2026-07-10-warmup-countdown.md`

## 实施

- 新增 `src/server/launch-gate.ts`：`getLaunchGate` server function（读 `STATS_OPEN_AT`，服务器时钟判定）+ `ensureStatsOpen()` 路由守卫（未开放 `throw redirect({ to: '/warmup' })`，开放结果模块级缓存）。
- `/`、`/loading`、`/summary`、`/share`、`/report` 五个路由加 `beforeLoad: () => ensureStatsOpen()`。
- 新增 `/warmup` 路由与 `WarmupPage`：loader 返回 gate（已开放时反向重定向回 `/`）；倒计时首帧用 `serverNow` 保证 SSR 一致，tick 用时钟偏移校正；归零后就地换成「进入」按钮。
- `/form` loader 改为并行 `{ shows, gate }`；未开放时提交按钮为「保存，开放后生成」，点击 toast + 回 `/warmup`。
- `wrangler.jsonc` vars 增加 `STATS_OPEN_AT: 2026-07-13T00:00:00+08:00`。

## 验证（本地 dev server 实测）

- 预热态：`/`、`/summary`、`/share`、`/report`、`/loading` 均 307 → `/warmup`；`/form`、`/warmup` 200；`/warmup` SSR HTML 含正确首帧倒计时（02 天 07 时…）。
- 开放态（`.dev.vars` 把 `STATS_OPEN_AT` 调到过去）：受限路由 200，`/warmup` 307 → `/`。
- `bun run build`（含 tsc）与 biome 对新文件均通过。

## 踩坑

- **`.dev.vars` 删除不触发 env 重载**：删掉 `.dev.vars` 后 dev server 仍用旧值，`touch wrangler.jsonc` 触发配置重载后恢复。本地调试开放态时记得改完 touch 一下。
- FormPage 里 `SelectTrigger`（location-city）有一处与本次无关的既有 biome 格式漂移，未顺手改动以保持 diff 聚焦。
