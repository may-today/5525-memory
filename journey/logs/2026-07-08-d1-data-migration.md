# D1 数据迁移 + 统计页真实数据接入 — 实施记录

对应计划：`journey/plans/2026-07-08-d1-data-migration.md`

## 完成内容

- 新建 Cloudflare D1 数据库 `5525-memory-db`（`d8893eb8-63dd-4299-a905-7322f1f7b425`），绑定为 `wrangler.jsonc` 的 `DB`。
- `migrations/0001_init_schema.sql`：5 张表（`tour_types`/`tours`/`tours_cities`/`shows`/`setlist_items`），`shows` 去掉 `is_lighted`/`talking_styles`/`is_charity` 三个死字段，补全外键，加索引。
- `migrations/0002_seed_data.sql`：复用 `raw-data/init_5525.sqlite.sql` 的 INSERT 语句，按依赖顺序排列（`tour_types → tours → tours_cities → shows → setlist_items`，第一版按原文件顺序导致外键冲突，已修正）。本地 `--local` 迁移后核对行数：shows=163、setlist_items=6999、tours_cities=30、tours=1、tour_types=4，与预期完全一致。
- 城市坐标未建表，改为 `src/server/city-coordinates.ts` 里的硬编码常量（原 `SummaryCardCity` 的 17 个坐标 + 补的 6 个），只被 `src/server/*.ts` 引用。
- 数据访问层：`src/server/db.ts`（`getDb`，`cloudflare:workers` 的 `env.DB`，已用临时 spike 验证过这条路径在 `vite dev` 下可行）、`src/server/shows.ts`（`getAllShows` + 内部 `queryAllShows`/`queryShowsByIds`，含 `'NULL'` 字符串→JS `null` 归一化）、`src/server/summary.ts`（唯一导出给 `/summary` 用的 `getSummaryData(showIds)`，一次性返回 `allShows`/`selectedShows`/`overview`/`cityMarkers`/`songStats`）。
- `/form` 路由加 loader 调 `getAllShows()`，`FormPage` 改用 `useLoaderData()`。
- `SummaryContainer` 新增 `useSummaryData` hook（`src/hooks/useSummaryData.ts`）：决定 showIds 来源（store 或 sessionStorage）、调一次 `getSummaryData`、把 `selectedShows` 写回 `concertStore`（顺带修复硬刷新导致选中场次丢失的已知缺口）、通过 `SummaryDataContext` 提供给子卡片，请求完成前展示 loading spinner。
- `SummaryCardOverview`/`SummaryCardCity`/`SummaryCard1`/`SummaryCard3` 都改为从 Context 读取真实数据；`SummaryCardCity` 删除硬编码 markers，底部占位面板改为列出当前城市下用户选中的场次。`SummaryCard2`（里程）本轮未动，仍是占位符。
- `Show` 类型删除未使用的 `isLighted`，`showStartTime` 改为可空（实际数据里 163 场中有 18 场为 null）。
- `tsconfig.app.json` 的 `include` 加入 `worker-configuration.d.ts`，否则 `src/server/*.ts` 里的 `D1Database`/`cloudflare:workers` 类型不可见。

## 验证结果

- `bun run typecheck`：无新增错误（已用 `git stash` 对比确认剩余错误均为迁移前就存在的既有问题：`context.ts`/`SummaryCardOverview.tsx` 的 `toSorted` 缺 ES2023 lib、`theme-provider.tsx`/`concert-store.ts` 的未使用变量）。
- `vite build`：client + ssr 均构建成功；抽查 `dist/client/assets/*.js` 未发现任何 SQL 语句或城市坐标字符串（吉隆坡/拉斯维加斯等），确认原始数据和查询逻辑未进入客户端 bundle。
- `bun run dev` + curl：`/form` 的 SSR 输出包含真实 D1 数据（如"台中 · 洲际棒球场""高雄 · 世运主场馆"）；`/summary` 的 SSR 输出正确渲染 loading spinner（数据在客户端 `useEffect` 里异步获取，符合设计）。

## 未验证事项（无浏览器自动化工具，需人工确认）

- 实际点击流程：`/form` 选场次 → 提交 → `/summary` 各卡片是否显示预期真实数据（Overview 高亮、City 地球标记与详情面板、Card1 数字、Card3 歌曲统计）。
- 硬刷新 `/summary` 后选中状态是否正确恢复（这是本次顺带修复的缺口，逻辑已写好但未做真实交互验证）。
- `getSummaryData` 的 RPC 调用本身未做端到端请求测试（尝试过手工构造 TanStack Start 的内部帧协议调用，过于复杂未继续；改为通过验证 `getAllShows`——两者共用同一套 `queryAllShows`/`queryShowsByIds` 底层查询——的真实 SSR 输出来间接确认查询链路可用）。

## 后续

- `data/shows.json` 已无引用，建议验证通过后单独提交删除。
- Card2（里程）留待下一轮讨论出发地采集方式。
- AI 自然语言查询能力另行讨论。
