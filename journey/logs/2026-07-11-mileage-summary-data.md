# 奔波距离统计接入记录

## 实施

- 表单将城市选择和浏览器定位持久化在 `concert-form-data:v1`；`useSummaryData` 现从实时 store 读取，硬刷新时回退读取 localStorage，并随场次 ID 提交给 `getSummaryData`。
- 服务端以「定位至已去过城市的去重往返距离总和」计算 `mileage`：优先用浏览器定位，未提供或无效时回退到所选城市／地区中心；两者皆不可用时为 `null`。无坐标映射的巡演城市跳过；每个城市只计算一次 `getDistance` 单程距离并乘二。
