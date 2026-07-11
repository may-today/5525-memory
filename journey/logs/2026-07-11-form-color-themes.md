# 表单页配色主题调整（2026-07-11）

计划见 `journey/plans/2026-07-11-form-color-themes.md`。

## 完成内容

- `/form` 的 shadcn primary 颜色在页面作用域内改为 `sky-400`，主要操作按钮随之使用蓝色。
- 步骤进度、城市已选数量和底栏已选数字改为蓝色强调。
- 场次选中态改按子主题映射：5525 粉色、5525+1 蓝色、5525+2 橙色；未识别的值回退到数据的 `themeColor`。

## 验证

- `bun run lint`、`bun run typecheck`、`bun run build` 与 `git diff --check` 均通过。
- 本地 Vite 服务可启动；此沙箱环境的 HTTP 请求未能在合理时间内返回，未完成浏览器/HTTP 交互走查。构建期间 Wrangler 仍会因无权写入用户偏好目录的日志文件输出 `EPERM`，但不影响构建完成。
