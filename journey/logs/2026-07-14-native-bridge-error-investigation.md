# 原生桥接异常排查日志

- 搜索 `src/`、公共文件和配置，未发现 `sendDataToNative`、`sendPageHideMessage`、`window.webkit.messageHandlers` 或页面隐藏桥接代码。
- 2026-07-14 抓取生产首页；其脚本为应用资源、`/scripts/gc.js`、`https://app.rybbit.io/api/script.js`。
- 下载并检索 GoatCounter 和 Rybbit 的实际脚本，均未包含报错函数或 `webkit.messageHandlers`。
- 结论：异常来自宿主/内嵌浏览器注入代码，不属于 5525 Memory 应用 bundle；无安全的应用代码修复，建议在宿主修复并在错误平台过滤。
