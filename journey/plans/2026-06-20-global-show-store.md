# Form 场次全局 Store 计划

## 目标

使用 TanStack Store 保存 FormPage 已选择的完整场次信息，供后续页面和组件全局读取。

## 实施步骤

1. 新增场次选择 Store，提供选择、取消选择和清空操作。
2. 将 FormPage 的本地场次选择状态替换为 Store 订阅。
3. 保留提交时写入 `sessionStorage` 的兼容行为。
4. 更新设计文档与过程日志，并执行类型检查和构建验证。
