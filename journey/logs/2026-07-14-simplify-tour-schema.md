# 精简巡演数据库结构

## 进度

- 已确认工作区有其他进行中的未提交改动；本次将只新增独立 migration，并仅修改与精简 schema 直接相关的查询、类型与文档。
- 已完成依赖盘点。`themeColor`、`tourName` 为兼容现有展示而改由服务端提供常量，不再来自 D1；原有 `is_hidden` 查询条件将移除。
- 初版本地 migration 因 `setlist_items`、`report_submission_shows` 的外键引用而被 D1 拒绝，事务已回滚。改为在同一 migration 中无损重建两张子表，以保持外键始终有效。
- 修正后的 migration 已应用到本地 D1：仅剩 `shows`、`setlist_items`、`report_submissions`、`report_submission_shows`（另有 D1 系统表），`shows=163`、`setlist_items=7,379`，`foreign_key_check=0`。
- `bun run typecheck` 与 `git diff --check` 通过；全量 lint 仍被本次未改文件中的既有问题阻断。
- 新数据的 45 场嘉宾字段为逗号分隔的普通字符串（其余为空），不再是旧种子使用的 JSON 数组；`shows` 读取层已兼容 JSON 数组、普通字符串和空值。
- 已以 D1 直接执行 `getAllShows` 与 summary snapshot 的等价 SELECT，均返回精简列和正确歌单计数；`report_submissions` 的场次存在性查询也返回预期结果。
