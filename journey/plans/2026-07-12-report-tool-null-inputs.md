# 数据电台工具空参数兼容

## 目标

允许 OpenAI-compatible 模型在未使用可选统计筛选条件时传入 `null`（包括部分模型输出的字符串 `"null"`），并将其等同于省略该字段；同时兼容可选数值字段的纯数字字符串。真实的日期、数值和枚举错误仍由 Zod 拦截。

## 方案

1. 在 `report-tools.ts` 的共享输入 schema 中预处理空值。
2. 覆盖时间范围、场次范围、歌曲分段和排行上限等所有可选输入，并将数值字符串解析为整数。
3. 明确提示模型：未使用筛选条件时省略字段，不传 `null`。
4. 用类型检查和针对 schema 的运行时解析验证兼容与拒绝边界。

## 验证

- `bun run typecheck` 通过。
- `bun run lint` 通过。
- `git diff --check` 通过。
- `rank_cities` 实测能将 `startDate: null`、`endDate: "null"`、`month: null` 清洗为未传入；`2026-7-1` 仍被拒绝。
- `song_timeline` 实测能将用户提供的 `limit: "12"` 解析为整数 `12`，并清洗所有 `"null"` 可选字段；`"12x"` 仍被拒绝。
