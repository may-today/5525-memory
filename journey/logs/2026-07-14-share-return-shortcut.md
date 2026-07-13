# 分享页回访快捷入口

- 已确认 `/share` 底部现为「返回总结」并导航至 `/summary`；首页 `CoverPage` 是封面入口。
- 计划以独立 localStorage key 保存是否进入过 `/share`，不混入场次资料持久化结构；首页只在客户端挂载后显示快捷入口，避免 SSR hydration 不一致。
- 已新增 `share-page-visited:v1` 标记：分享页挂载时写入，首页挂载后读取。分享页底部现为「重新回顾」并链接至 `/`；首页按标记显示「回顾分享页」链接至 `/share`。
- 验证中发现全仓 `typecheck` 被既有 `src/pages/share/SharePoster.tsx` 的未使用 `passcode` 参数阻断；全仓 lint 另有既有 Form、Loading、Summary、shows 与 concert-store 规则错误。本次文件会单独完成 lint 与 diff 检查。
- 本次三个源码文件已通过 `biome lint` 与完整 `biome check`；`git diff --check` 也通过。
