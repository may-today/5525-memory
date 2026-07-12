# 回忆卡真实数据接入 — 实施日志

- 已开始：确认 `src/data/special-event.ts` 以 `YYYY.MM.DD` 日期维护回忆，而当前统计数据使用 `Show.showDate` 的 `YYYY-MM-DD` 格式；接入时需归一化日期，并沿用跨日回忆只计一次的规则。
- 已完成：回忆卡按真实事件逐条展示 CDN 封面和 `title`；默认选择有命中项时的「专属回忆」，否则回退到「全部回忆」，头部可切换范围。talking 继续使用原有占位文本。
- 验证：`bun run typecheck`、`bun run lint` 和 `git diff --check` 全部通过。本地 Vite 服务已成功编译启动；当前执行环境无法从另一终端连接其 loopback 端口，因此未能完成 curl 页面请求。
