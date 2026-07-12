# 数据电台工具调用调试日志（2026-07-12）

## 完成

- 已确认 `/api/report-chat` 由 `src/server/report-chat.ts` 的 TanStack AI `chat()` 驱动，统计工具由 `createReportTools()` 提供。
- 使用 TanStack AI 内建 `debug` 的 `tools` 分类记录调用前后数据，不额外编写会改变工具行为的 middleware。
- 新增 `REPORT_AI_TOOL_DEBUG`：值为 `true` 或 `1` 时启用；`wrangler.jsonc` 默认 `false`。启用后显式关闭 request、provider、output、middleware、agentLoop、config、sandbox 等类别，仅保留 tools 与 errors。
- 已运行 `bun run cf-typegen`、`bun run lint`、`bun run typecheck` 和 `git diff --check`，均通过。
