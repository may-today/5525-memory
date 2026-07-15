# Android `toSorted` 兼容修复计划

## 背景

部分 Android 用户从表单提交进入统计流程后遇到 `t.toSorted is not a function`。项目的 TypeScript 目标为 ES2023，因此类型检查允许 `Array.prototype.toSorted`，但编译目标不会为旧版 Chrome / Android WebView 补齐该原生 API。

## 计划

1. 找出所有应用代码中的 `toSorted` 调用，并确认表单后续页面的触发路径。
2. 将调用替换为语义等价、不会修改原数组且兼容旧浏览器的复制后 `sort`。
3. 运行类型检查、lint 与生产构建，并检查客户端构建产物不再包含 `toSorted`。
4. 更新 journey 设计快照与过程日志，记录浏览器兼容边界。

## 验收标准

- 应用源码及客户端生产产物不含 `toSorted`。
- 排序结果与原实现一致，输入数组仍不被修改。
- 类型检查和生产构建通过；lint 不产生与本次改动相关的新问题。
