# 数据电台工具空参数兼容日志

- 已确认 `rank_cities` 等工具的 `.optional()` 字段不接受模型传来的 `null`；日期字段还会出现字符串 `"null"`。
- 计划在共享工具 schema 边界将这两种空值规范为 `undefined`，其余无效输入维持 Zod 校验失败。
- 已在共享 schema 中落实该规范化，并在系统提示中要求模型省略未使用字段。
- 同时接回已有的工具调试环境开关，避免类型检查因未使用的配置函数失败。
- 验证：类型检查、Biome lint、diff 空白检查均通过；`rank_cities` 成功清洗 `null` / `"null"`，错误日期仍被拒绝。
- 新发现：模型将 `song_timeline.limit` 序列化为字符串 `"12"`，需在数值可选字段同样兼容纯数字文本。
- 已把 `month` 与各工具的 `limit` 限制为纯整数文本可转换；完整 `song_timeline` 示例现可解析为 `{ concertScope: "selected", limit: 12, section: "all", songTitle: "温柔" }`。
