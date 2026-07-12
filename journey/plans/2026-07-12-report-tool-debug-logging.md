# 数据电台工具调用调试日志（2026-07-12）

## 目标

为 `/api/report-chat` 的 TanStack AI 统计工具调用提供可开关的服务端调试日志，便于在数据电台联调时查看工具名称、入参、出参和执行错误。

## 方案

1. 新增 Worker 环境变量 `REPORT_AI_TOOL_DEBUG`，生产默认值为 `false`。
2. 在 `src/server/report-chat.ts` 解析该开关；仅当值为 `true` 或 `1` 时向 `chat()` 传入 TanStack AI 的 `debug` 配置。
3. 只启用 `tools` 分类，显式关闭 request/provider/output 等类别，避免记录模型请求、原始流式输出或无关噪声。
4. 更新 `journey/design.md`，说明开关、日志范围和默认关闭行为。
5. 重新生成 Worker 环境类型，并运行静态检查。

## 验证

- `bun run cf-typegen`
- `bun run lint`
- `bun run typecheck`
- `git diff --check`
