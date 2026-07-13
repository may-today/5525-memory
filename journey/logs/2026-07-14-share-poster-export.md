# /share 海报图片导出

- 已确认现状：`SharePage` 的「保存图片」按钮被硬编码为 disabled；星轨海报由 `SharePoster` 以 DOM/SVG 组合渲染。
- 正在接入浏览器端 PNG 导出，保留海报视觉及现有口令分享流程。
- 已加入 `html-to-image`，通过海报根元素 ref 以 2 倍像素密度导出 PNG；导出过程中按钮显示进度并防止重复触发，失败时提供截图兜底提示。
- 验证：本次文件 Biome lint、`bun run typecheck`、`git diff --check` 与 `bun run build` 已通过。全仓 lint 仍由既有 Form/Loading/Summary、shows、concert-store 的规则错误失败；自动浏览器服务在当前环境不可用，未能自动接收实际下载事件。
- 后续调整：移除尚未实现的原生「分享」按钮，避免展示不可用操作。
