# 概览卡隐藏匿名登记统计（2026-07-14）

- `SummaryCardOverview` 已移除对 `reportSubmission` 的 store 订阅、同场人数聚合与登记序号展示。
- 匿名登记、持久化与重试逻辑未改动，仍可供后续功能消费。
- `journey/design.md` 已同步为概览卡不读取或展示该统计。

## 验证

- `git diff --check` 通过。
- `bun run typecheck` 未通过：既有的 `src/pages/share/SharePoster.tsx:319` 未使用 `passcode` 参数报错，与本次改动无关。
