# 预热页与限时开放门禁

## 背景

统计流程（生成 / 统计回顾 / 分享 / 专属报告）限时开放：默认 2026-07-13 起可用，开放时间可通过环境变量调整。开放前访问者应落到预热页，看到倒计时，并可以提前填写表单（昵称、城市、场次），开放后回来一键生成。

## 方案

### 1. 开放时间来源（服务端权威）

- 新增 `src/server/launch-gate.ts`：
  - 读取 Cloudflare Workers 环境变量 `STATS_OPEN_AT`（ISO 8601，建议带时区，如 `2026-07-13T00:00:00+08:00`）；缺失或非法时回退到内置默认值 `2026-07-13T00:00:00+08:00`。
  - `getLaunchGate` server function（GET）返回 `{ isOpen, opensAt, serverNow }`。`isOpen` 以服务器时钟为准，客户端时钟只用于倒计时显示（用 `serverNow` 校正偏差）。
  - `ensureStatsOpen()` 守卫助手：给路由 `beforeLoad` 用，未开放时 `throw redirect({ to: '/warmup' })`。开放结果在模块级缓存（时间单向，开放后不再回查），避免每次导航都发一次请求。
- `wrangler.jsonc` 的 `vars` 增加 `STATS_OPEN_AT`。本地想调试预热态/开放态，用 `.dev.vars` 覆盖。

### 2. 路由门禁

- 受限路由：`/`（封面）、`/loading`、`/summary`、`/share`、`/report` —— 未开放时 `beforeLoad` 重定向到 `/warmup`。预热期访客的落地页即预热页。
- 不受限：`/form`（预热页入口，允许提前填写）、`/warmup` 本身。
- `/warmup` 反向守卫：已开放时重定向回 `/`，避免开放后还能停在预热页。
- 已知边界：路由守卫不保护 server function 本身（`getSummaryData` 等仍可被直接调用）；本项目数据非敏感，接受该边界，不在数据层重复拦截。

### 3. 预热页 `/warmup`

- `src/routes/warmup.tsx` + `src/pages/WarmupPage.tsx`。
- loader 返回 `{ opensAt, serverNow }`；首帧剩余时间由 `serverNow` 算出（SSR 与首次客户端渲染一致），挂载后每秒 tick，用 `serverNow - Date.now()` 的偏移校正客户端时钟。
- 视觉沿用封面页的编辑排版语言：分区边框、texture、Marquee、WJH 大标题；倒计时数字用 Doto 点阵体（`font-geist`）+ 品牌橙辉光，天/时/分/秒四组。
- 入口按钮「先填好场次」→ `/form`；说明文案告知选择会保存在本机，开放后回来直接生成。
- 倒计时归零后就地切换为「进入」按钮（导航到 `/`，服务端守卫复核）。

### 4. 表单预填闭环

- `/form` loader 改为并行返回 `{ shows, gate }`。
- `FormPage` 未开放时：最后一步按钮文案改为「保存，开放后生成」，点击后 toast 确认并回到 `/warmup`（数据本就随 store 持久化到 localStorage，无需额外保存动作）；已开放时行为不变（→ `/loading`）。

## 不做的事

- 不做服务端持久化预填数据（继续用现有 localStorage 方案）。
- 不给 server function 数据层加时间门禁。
