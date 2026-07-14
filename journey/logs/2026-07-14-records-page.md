# 巡回记录页 /records 实施日志

计划见 `journey/plans/2026-07-14-records-page.md`，设计快照已并入 `journey/design.md`「巡回记录页」章节。

## 完成内容

- `src/routes/records.tsx`：`ensureStatsOpen()` 门禁 + `getAllShows()` loader，无新增 server function。
- `src/pages/records/RecordsPage.tsx`：驻站分组（连续同 city+venue+subTheme+versionName）、年份分节、航迹线时代配色、IntersectionObserver 滚动显现。
- `src/pages/records/SetlistImageOverlay.tsx`：歌单长图全屏弹层，`referrerPolicy="no-referrer"` 绕开微博图床防盗链，失败兜底原图链接，展示歌单贡献者落款。
- `src/pages/SharePage.tsx`：新增「5525 巡回记录」入口卡（white/10 hairline，与特别企划渐变边框区分）。
- `index.css`：`records-*` 样式段 + reduced-motion 兜底。

## 过程记录

- 本地 D1 抽样确认 `playlist_img` 为微博 sinaimg.cn 直链且约 17/163 场为空——由此确定 no-referrer 与「歌单暂缺」两个处理。
- biome 对长图 `<img>` 的 width/height 规则按仓库先例（Memories 卡 3:4 占位）给 3:5 占位比；`onLoad/onError` 触发 `noNoninteractiveElementInteractions` 误报，加 biome-ignore 说明。
- 走查小坑：正在运行的 dev server 不会热加载新路由文件到客户端路由树（SSR 已认识 /records，客户端仍走 `$` catch-all 重定向回 `/`），需要重启 dev server。
- 通过 `bun run typecheck` 与 biome check；用户本地浏览器验证通过。
