# 原生桥接异常排查

## 目标

定位线上 `sendDataToNative` / `sendPageHideMessage` 的 JavaScript 异常，并在应用可控范围内消除根因或给出可靠处置。

## 排查步骤

1. 搜索仓库及构建输入，确认是否由应用代码调用原生 WebView 桥接。
2. 获取生产首页和所有页面加载的第三方脚本，核对报错函数是否随应用下发。
3. 根据脚本 URL 与调用栈判断责任边界，选择不影响真机桥接的处置方式。

## 结论与处置

- 应用源码、生产 HTML、GoatCounter 脚本和 Rybbit 脚本均不包含报错函数或 `window.webkit.messageHandlers`。
- 堆栈指向 `https://5525.mayday.land/:1`，而不是任一可下载的脚本资源，符合 iOS 宿主/内嵌浏览器把脚本注入页面主文档上下文的特征。
- 不在页面中伪造 `window.webkit`：这会掩盖宿主桥接缺失，且可能让原生页面隐藏事件误发。
- 应由触发该错误的宿主修复为在调用前检测 `window.webkit?.messageHandlers` 与目标 handler；应用侧只需在错误分析平台将这类外部注入错误排除，避免污染业务错误数据。
