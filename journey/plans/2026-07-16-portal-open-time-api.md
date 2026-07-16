# 任意门开放时间接口化

## 目标

将 `PortalBookingButton` 的预约开放时间从前端硬编码改为读取
`https://mayday.bandchina.com/api/memoir-config/public` 返回的
`data.memoir_open_at`，并确保倒计时与底部日期文案使用同一时间来源。

## 方案

- 通过 TanStack Start GET server function 请求外部公开接口，绕过目标接口未开放浏览器 CORS 的限制。
- 校验响应状态、业务 `code` 与 `memoir_open_at` 字段；无时区的接口值按北京时间（UTC+8）解析。
- 客户端挂载后读取开放时间并启动现有每秒倒计时。
- 加载中显示占位；请求失败或字段非法时显示“开放时间待定”，不继续展示硬编码日期。
- 用 `Asia/Shanghai` 格式化底部开放日期，保证倒计时目标与文案一致。

## 验证

- 运行 TypeScript 类型检查与项目构建。
- 检查目标文件 diff，确认保留既有未提交改动且不引入固定开放时间。
