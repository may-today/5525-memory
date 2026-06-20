# Form 场次全局 Store 日志

- 建立实施计划，确认 Store 保存完整的 `Show` 对象数组。
- 保留现有 `concert-form-data` sessionStorage 数据格式，避免影响后续页面。
- 新增 `src/stores/concert-store.ts`，集中提供切换选择和清空选择操作。
- FormPage 已改为订阅全局 `selectedShows`，不再持有本地场次选择状态。
- 更新设计文档，将 TanStack Store 定义为运行期全局数据来源。
- 类型检查和生产构建通过；全量规范检查仍受仓库既有格式与组件告警影响。
