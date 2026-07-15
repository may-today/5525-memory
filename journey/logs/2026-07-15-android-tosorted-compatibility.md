# Android `toSorted` 兼容修复日志

## 2026-07-15

- 复现线索确认：源码共有 4 处 `toSorted`，其中统计概览、回忆卡和贡献图会在表单后的客户端页面执行。
- 根因确认：`tsconfig.app.json` 使用 ES2023 仅提供类型与语法目标，不会为旧 Android Chrome / WebView polyfill `Array.prototype.toSorted`。
- 处理策略：使用复制数组后调用 `sort`，保持原有非变异语义，不引入全局原型修改或额外 polyfill 依赖。
- 已替换统计概览、回忆卡、贡献图和服务端报告登记中的全部 4 处调用。
- `bun run build` 通过（含 Vite 客户端/SSR 生产构建与 `tsc -b`）。
- 扫描 `dist/client`、`dist/server`，未发现 `toSorted` 残留；4 个改动源码文件的 Biome lint 通过。
- 全仓 `bun run lint` 仍有 10 个本次修改前已存在、且位于未改动代码的规则错误（异步调用 `void`、函数内正则和 UUID 位运算），本次不扩张范围处理。
