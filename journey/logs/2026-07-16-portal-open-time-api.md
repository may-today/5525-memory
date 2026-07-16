# 任意门开放时间接口化日志

- 已读取 `journey/design.md` 与目标组件。
- 已执行 Intent skill discovery；加载 `start-core/server-functions` 指引。
- 已确认公开接口返回 `data.memoir_open_at = "2026-07-18T19:00:00"`。
- 已确认接口对浏览器 Origin 不返回 `Access-Control-Allow-Origin`，需要通过同源 server function 获取。
- 已确认目标组件原有一处未提交改动：底部日期由 `7/17 19:00` 改为 `7/18 19:00`；后续动态化会保留其实际意图。
- 已新增 `getPortalOpenTime` GET server function，校验上游响应并将无时区开放时间按 UTC+8 解析。
- 已将倒计时目标和底部日期文案切换为接口数据；加载和失败状态不再显示固定日期。
- `bun run typecheck` 与 `bun run build` 已通过；构建产物确认 server function 被拆分到服务端 chunk。
- 目标 TypeScript 文件通过 Biome check，`git diff --check` 无空白错误。
