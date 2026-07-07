# D1 数据迁移 + 统计页真实数据接入

## Context

`raw-data/` 是一份未受保护的巡演数据导出（163 场演出、6999 条歌单明细），而 `/summary` 的 5 个统计卡片里，只有「场次概览」接了真实数据，City/Card1/Card2/Card3 要么是硬编码、要么是占位符 `—`。目标是把 `raw-data` 迁移进 Cloudflare D1，让统计页从服务端按需查询真实数据，而不是把原始数据整份暴露给前端。AI 自然语言查询能力是后续单独讨论的话题，本计划只解决「数据迁移 + 基础统计展示」。

范围内决策：
- Overview 和 `/form` 一并切到 D1（单一数据源），不再依赖 `data/shows.json`。
- `shows` 表丢弃 3 个恒定无区分度的字段：`is_lighted`、`talking_styles`、`is_charity`。
- **城市坐标不建表**：不新增 `city_coordinates` D1 表，坐标作为普通常量对象写在后端代码（`src/server/city-coordinates.ts`），只被 server function 引用，不进客户端 bundle。
- **只暴露一个统计 server function**：`/summary` 各卡片需要的数据（全量场次、已选场次、城市标记、聚合统计、歌单统计）由单个 `getSummaryData(showIds)` 一次性产出并返回，而不是每张卡片各自发起请求。`/form` 页面选场次用的"全量目录"是另一个独立关注点（不是"统计数据"），保留单独的 `getAllShows()`。
- Card2（里程）本轮不接数据，保持占位——出发地采集是产品决策，留到下一轮。

## 技术方案

**D1 访问方式**：TanStack Start 的 `createServerFn` 本身不传递 Cloudflare `env`/绑定（`start-storage-context` 只带 `request`/`startOptions`）。做法是在 server function 内部 `import { env } from 'cloudflare:workers'`——`@cloudflare/vite-plugin` 官方支持的内置模块，`worker-configuration.d.ts` 也已声明 `env: Cloudflare.Env`。实现前先跑一次最小 spike（临时 `createServerFn` 执行 `SELECT 1`，确认 `vite dev` 下能拿到 D1 绑定）再开始写正式查询函数。

**迁移机制**：用 `wrangler d1 migrations`，schema 和种子数据都作为版本化 migration 文件，`--local`/`--remote` 用同一套文件保证本地和线上一致。

## D1 Schema（5 张表，不含 city_coordinates）

`migrations/0001_init_schema.sql`：`tour_types`、`tours`、`tours_cities`、`shows`（去掉 3 个死字段）、`setlist_items`。相比 `raw-data/init_5525.sqlite.sql`：
- 补全外键：`shows.tour_type_id/tour_city_id`、`tours_cities.tour_id`（`PRAGMA foreign_keys = ON`）。
- 索引：`shows(show_date)`、`shows(tour_city_id)`、`tours_cities(tour_id)`（`setlist_items(show_id)` 已有）。

## 种子数据

`migrations/0002_seed_data.sql`：直接复用 `raw-data/init_5525.sqlite.sql` 里已正确类型化的 `INSERT` 语句（整数就是整数），`shows` 的列清单去掉 3 个死字段。不再需要 city_coordinates 的种子部分。

## 城市坐标（后端硬编码，非 D1 表）

新文件 `src/server/city-coordinates.ts`：一个 `Record<string, { latitude: number; longitude: number }>` 常量，原样迁移自 `src/pages/summary/cards/SummaryCardCity.tsx` 的 `showcaseDefaultMarkers`（17 个：桃园/新加坡/悉尼/拉斯维加斯/天津/香港/杭州/哈尔滨/台北/北京/上海/贵阳/长沙/郑州/厦门/广州/台中），再补 6 个缺失城市（吉隆坡、太原、成都、武汉、深圳、高雄，近似城市中心坐标，可后续精修）。该文件只被 `src/server/*.ts` 引用，不被任何客户端组件直接 import，从而保持"只在后端逻辑里，不进客户端 bundle"。

## D1 setup 步骤

1. `bunx wrangler d1 create 5525-memory-db`，把 `database_id` 写进 `wrangler.jsonc` 的 `d1_databases`（`binding: "DB"`, `migrations_dir: "migrations"`）。
2. `bun run cf-typegen` 重新生成 `worker-configuration.d.ts`。
3. `bunx wrangler d1 migrations apply 5525-memory-db --local`；上线前再跑 `--remote`。

## 数据访问层

- `src/server/db.ts`：`getDb()`，用 `createServerOnlyFn` 包一层 `cloudflare:workers` 的 `env.DB`。
- `src/server/shows.ts`：
  - 内部 helper 查询全量 `is_hidden=0` 场次（含 `setlistCount` 现查子查询、`'NULL'` 字符串→JS `null` 的归一化）。
  - `getAllShows()` — 导出给 `/form` 用，返回全量场次。
- `src/server/city-coordinates.ts` — 硬编码坐标表（见上）。
- `src/server/summary.ts` — **唯一**导出给 `/summary` 用的 server function：
  ```ts
  interface CityMarker { cityName: string; latitude: number; longitude: number }
  interface SummaryData {
    allShows: Show[]                 // Overview 背景层 + City 兜底城市列表
    selectedShows: Show[]            // 按 showIds 解析出的完整场次（同时用于刷新恢复）
    overview: { totalShows: number; cityCount: number; venueCount: number }  // Card1
    cityMarkers: CityMarker[]        // City 卡片地球标记
    songStats: { totalSongs: number; topSong: { title: string; count: number } | null }  // Card3
  }
  export const getSummaryData = createServerFn({ method: 'POST' })
    .validator((showIds: number[]) => showIds)
    .handler(async ({ data: showIds }): Promise<SummaryData> => { ... })
  ```
  内部：全量场次复用 `shows.ts` 的查询 helper；`selectedShows` 按 `showIds IN (...)` 查；`cityMarkers` 用选中场次（为空则用全量场次）去重后的城市名去查 `city-coordinates.ts` 常量表；`songStats` 用 `db.batch()` 对 `setlist_items` 一次拿到 `item_type='song'` 总数 + 按 `title` 分组最高频的一首（口径：含安可段落的歌，排除 medley/vcr/talking/event/special_guest/interaction）。

这样 `/summary` 挂载时只发一次请求，把 5 张卡片（Card2 除外）需要的数据一起拿回来。

## 页面接入

- `src/routes/form.tsx`：加 `loader: () => getAllShows()`；`FormPage.tsx` 用 `useLoaderData()` 替换原来的 `import shows from '../../data/shows.json'` 静态导入，分组逻辑从模块级常量改成组件内 `useMemo`。
- `src/pages/summary/SummaryContainer.tsx`：新增 `useSummaryData` hook——
  1. 决定要传的 `showIds`：`concertStore.selectedShows` 非空就用它的 id 列表；为空则读 `sessionStorage`（键 `concert-form-data:v1`）里的 `showIds`。
  2. 调一次 `getSummaryData(showIds)`。
  3. 把返回的 `selectedShows` 写回 `concertStore`（顺带修复"硬刷新 `/summary` 导致选中场次丢失"的已知缺口——之前只写 sessionStorage 不读回）。
  4. 用一个 Context（如 `SummaryDataContext`）把 `allShows`/`overview`/`cityMarkers`/`songStats` 提供给子卡片,请求完成前展示现有的 loading spinner。
- `SummaryCardOverview.tsx`：`allShows` 改从 Context 读（不再 import JSON），`selectedShows` 高亮逻辑不变（仍订阅 `concertStore`）。
- `SummaryCardCity.tsx`：删除硬编码的 `showcaseDefaultMarkers`，markers 改从 Context 的 `cityMarkers` 读；底部详情面板列出当前聚焦城市里 `concertStore.selectedShows` 中的场次（日期 + `dayLabel`）。
- `SummaryCard1.tsx`：读 Context 的 `overview`（`totalShows`/`cityCount`/`venueCount`）替换两个 `—`；其余 6 个占位统计项本轮不动。
- `SummaryCard3.tsx`：读 Context 的 `songStats` 替换总歌曲数和最高频歌曲的占位符。
- `SummaryCard2.tsx`：本轮不动。

## 收尾清理

- `data/shows.json` 在 `FormPage`/`SummaryCardOverview` 都切完之后不再被引用，验证通过后单独提交删除（不与本次改动合并，方便回滚）。
- `src/types/index.ts` 里确认全仓库无引用的 `Show.isLighted` 字段一并删除。

## 关键文件

- `wrangler.jsonc` — 加 `d1_databases` 绑定
- `migrations/0001_init_schema.sql`、`migrations/0002_seed_data.sql`（新建）
- `src/server/db.ts`、`src/server/shows.ts`、`src/server/city-coordinates.ts`、`src/server/summary.ts`（新建）
- `src/routes/form.tsx` — 加 loader
- `src/pages/FormPage.tsx`、`src/pages/summary/SummaryContainer.tsx`、`src/pages/summary/cards/SummaryCardOverview.tsx`、`SummaryCardCity.tsx`、`SummaryCard1.tsx`、`SummaryCard3.tsx`

## 验证

1. `wrangler d1 execute 5525-memory-db --local --command "SELECT COUNT(*) FROM <table>"`：shows=163、setlist_items=6999、tours_cities=30、tours=1、tour_types=4。
2. 抽查一条 `contributor`/`show_start_time` 为字面量 `'NULL'` 的记录，确认 `getAllShows()`/`getSummaryData()` 之后前端拿到的是 JS `null`。
3. `bun run typecheck`、`bun run build`（后者顺带验证 `cloudflare:workers` 在生产构建里也能正确解析）。
4. `bun run dev` 手工过一遍：`/form` 选跨城市的几场 → 提交 → `/summary` 依次检查 Overview「N 场属于你」、City 卡片地球只显示已选城市（底部面板列出该城市的场次）、Card1 的总场次/城市数、Card3 的总歌曲数与最高频歌曲。
5. **在 `/summary` 直接硬刷新**，确认短暂 loading 后所有卡片恢复到刷新前的选中状态。
