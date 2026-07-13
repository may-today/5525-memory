# 岁月留声机详情覆盖层

- 修复：打开唱片详情时，`SummaryCardSongWall` 向 `SummaryContainer` 报告覆盖层状态。
- 结果：全局「滑动探索」提示会隐藏，键盘切页也会暂停，详情关闭或组件卸载后恢复。
- 验证：`bun run typecheck` 通过；全量 lint 仍有本次修改前已存在的规则告警。
