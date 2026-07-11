# 5525 Memory 设计文档

## 项目定位

5525 Memory 是一个移动端优先的五月天 #5525 巡回演唱会回顾网页应用。用户选择自己参加过的场次后，应用会生成可视化、可分享的个人巡演总结。

## 当前状态（2026-07-10）

项目已迁移至 TanStack Start，完整页面流程可以正常跳转。表单使用真实场次目录，并为后续统计流程保存用户选择的场次 ID。统计页面使用 D1 真实数据生成场次、城市、歌曲、随机曲目（专属歌单 + 最小众歌单）和嘉宾统计；报告页已从 mock 效果图升级为 TanStack AI 驱动的结构化报告卡片，基于用户已选场次调用受控统计工具生成结果。

## 技术架构

- **应用框架**：TanStack Start + React 19 + Vite + TypeScript
- **样式方案**：Tailwind CSS 4 + shadcn
- **路由方案**：TanStack Router 文件路由与服务端渲染
- **部署环境**：通过 Cloudflare Vite 插件部署至 Cloudflare Workers

## 页面流程

```text
/（封面）→ /form（场次选择）→ /loading（生成过渡）→ /summary（统计回顾）→ /share（分享）
                                                                        └→ /report（专属报告，效果图）

开放前：/warmup（预热倒计时）→ /form（提前填写，保存后回到 /warmup）
```

封面页底部的「隐私声明」与「感谢名单」为可点击入口，分别以 shadcn `Sheet` 的底部面板展示可滚动的完整文字；不离开首页，也不会打断「开始回忆」的主流程。

## 关键设计决策

### 使用标准路径与服务端渲染

Cloudflare Workers 负责处理直接路由请求，因此页面使用 `/form` 等标准路径，而不是哈希路由。根路由统一管理 HTML 文档、共享布局和主题提供器。

### 使用 Cloudflare Workers 运行时

应用通过 Cloudflare Vite 插件使用 TanStack Start 默认服务端入口。Wrangler 已启用 `nodejs_compat` 和可观测性，并绑定了 Cloudflare D1（见下方「场次数据与 D1」）。

### 场次数据与 D1（2026-07-08）

场次、歌单、巡演城市等数据已从 `data/shows.json` 迁移进 Cloudflare D1（`5525-memory-db`），不再把 `raw-data/` 的原始导出直接暴露给前端。数据访问收敛成 `src/server/*.ts` 里的少数 server function（`getAllShows`、`getSummaryData`），后者一次性返回 `/summary` 各卡片需要的全部数据（Overview/City/Card1/Card3/嘉宾统计；Card2 里程暂缓）。`getSummaryData` 每次调用只用一条 `shows` + `setlist_items` 联表语句读取所有未隐藏场次的完整快照（歌单数通过 window count 计算，避免相关子查询重复扫描），随后仅在 Worker 内存里按用户所选场次计算所有指标；原始歌单行不会传到浏览器。城市经纬度未建表，作为常量写在 `src/server/city-coordinates.ts`，只被 server function 引用。详见 `journey/plans/2026-07-08-d1-data-migration.md` 与 `journey/plans/2026-07-10-summary-single-query.md`。

表单分为两页：第一页采集可选昵称、城市选择和可选浏览器定位坐标；第二页按城市对可见场次分组并支持多选。城市选择使用 `src/components/ui/select.tsx` 和 `src/data/geo-coord.ts` 的省级/地区列表（含“不透露”“其他国家或地区”），浏览器定位不可用或失败时通过 app-level toast 提示。用户资料和已选择的完整场次对象保存在 TanStack Store 中，供路由间的组件全局订阅；store 每次变更都会以 `concert-form-data:v1` 为键同步到 `localStorage`（`profile` + `showIds`），`/form` 在拿到场次目录后会恢复资料并用这些 ID 恢复选择。恢复 profile / selectedShows 时会临时跳过 store 订阅器的自动持久化，避免先恢复 profile 时用空 `selectedShows` 覆盖掉 localStorage 里已有的 `showIds`；恢复场次后再写回完整状态。`/summary` 挂载时通过 `useSummaryData` hook 优先用 store，其次用 `localStorage` 里的 ID 换回完整场次数据，解决了硬刷新丢失选中场次的问题；写回 store 时会连同解析出的 profile 一起写入（2026-07-11）——此前只写 selectedShows，store 里的空 profile 会被持久化订阅器写回 `localStorage`，把用户填过的城市清空。

**本地开发**：D1 的本地状态是每台机器独立的 SQLite 文件（`.wrangler/state/v3/d1`，已 gitignore），完全由 Miniflare 模拟，不需要 Cloudflare 账号权限。新拉仓库或换机器只需要 `bunx wrangler d1 migrations apply 5525-memory-db --local` 再 `bun run dev`。

**多人协作**：`migrations/` 下的文件一旦被应用过就不能再改，schema 或数据的任何调整都通过 `wrangler d1 migrations create 5525-memory-db <name>` 新增下一个编号的文件；谁拉到新 migration 就本地重新 apply 一次即可，`wrangler` 只会应用尚未跑过的文件。

**远程（生产）D1**：迁移应用方式目前选择手动执行——有权限的人在需要发布时手动跑 `wrangler d1 migrations apply 5525-memory-db --remote`，再 `bun run deploy`。规模变大或发布频率变高后可以再考虑接入 CI 自动化。

### 表单页「旅程登记」视觉语言（2026-07-11）

表单页以「时空旅行登记」为叙事：步骤一登记旅客（eyebrow `PASSENGER`，标题「出发之前，先认识你」，出发地字段文案呼应城市卡「你从X出发」），步骤二登记时间坐标（eyebrow `TIME COORDINATES`，标题「你去过哪几场？」）。页头统一为 `FormStepHeader`：eyebrow + Doto 步骤号 + 两段式步骤进度（当前段 `sky-400` + 辉光）；表单根节点也在作用域内把 shadcn primary 设为 `sky-400`，让主要操作按钮一致使用蓝色。城市按首演日期排序即巡演路线，城市头部用 Doto 站号编码这条时间线。**签名元素**：场次行勾选后按巡演子主题点亮（5525 粉色 `#f472b6`、5525+1 蓝色 `#38bdf8`、5525+2 橙色 `#fb923c`；未知主题回退场次原始 `themeColor`），并用于左侧色条、复选块填色发光、行背景轻染与子主题标签；聚合选中数（城市徽标、底栏「已选 N 场 · M 座城市」的 Doto 数字）统一用 `sky-400`。步骤切换用 root div 换 `key` 触发 `form-step-in` 淡入上移；行背景（含 hover）统一收在 `index.css` 的 `.form-show-row` 里管理，避免与 Tailwind hover 工具类互相覆盖；新动画均已加入 reduced-motion 停用清单。见 `journey/plans/2026-07-11-form-redesign.md` 与 `journey/plans/2026-07-11-form-color-themes.md`。

### 限时开放与预热页（2026-07-10）

统计流程限时开放，开放时间由环境变量 `STATS_OPEN_AT`（ISO 8601，建议带时区）配置，缺失或非法时回退到内置默认 `2026-07-13T00:00:00+08:00`（见 `wrangler.jsonc` vars；本地调试用 `.dev.vars` 覆盖）。开放判定以服务器时钟为准（`src/server/launch-gate.ts` 的 `getLaunchGate` server function），客户端时钟只用于倒计时显示（用 `serverNow` 校正偏差）。

- **门禁**：`/`、`/loading`、`/summary`、`/share`、`/report` 在 `beforeLoad` 里经 `ensureStatsOpen()` 未开放时重定向到 `/warmup`；开放结果在模块级缓存（时间单向，开放后不再回查）。`/warmup` 反向守卫：已开放时在 loader 里重定向回 `/`。已知边界：路由守卫不保护 server function 本身，数据非敏感，接受该边界。
- **预热页**（`/warmup` + `src/pages/WarmupPage.tsx`）：沿用封面页的编辑排版语言（分区边框、texture、Marquee、WJH 标题），倒计时数字用 Doto 点阵体 + 品牌橙辉光；首帧剩余时间由 loader 的 `serverNow` 算出保证 SSR 一致，挂载后每秒 tick；开放日期以北京时间格式化（`Intl.DateTimeFormat` 固定 `Asia/Shanghai`，SSR/客户端确定性一致）。倒计时归零后就地切换为「进入」按钮（导航到 `/`，服务端守卫复核）。
- **提前填写**：`/form` 不受门禁限制，loader 并行返回 `{ shows, gate }`；未开放时最后一步按钮变为「保存，开放后生成」，点击后 toast 确认并回到 `/warmup`（数据本就随 store 持久化到 localStorage，无需额外保存动作）。

### 统计回顾使用单路由和内部状态

`/summary` 渲染 `SummaryContainer`，由其通过 `currentIndex` 管理当前统计页面。每个统计页面是独立组件，而不是独立路由，以便实现切换动画，并避免滑动手势导致 URL 频繁变化。

### 竖向切页与页面内纵向滚动的优先级

`SummaryContainer` 使用竖向滑动（上下）切换统计页面：`|deltaY| > |deltaX|` 且 `|deltaY| >= 40` 时触发切页。每页底部中心悬浮展示"滑动探索"引导箭头（最后一页替换为"生成总结"按钮），无页面圆点指示器。

需要页内纵向滚动的统计页（`SummaryCardOverview`、`SummaryCardPlaylist`、`SummaryCardRareSongs`、`SummaryCardMemories`）在可滚动区域加 `data-scroll-container` 属性。切页前，`SummaryContainer` 检查该元素是否已滚动到底部（前进）或顶部（后退），未到则不切页，内部滚动优先。

### 切页过渡动画

切页时同时渲染旧页（outgoing）和新页（incoming），两者均为 `absolute inset-0`，使用相同的 easing 函数和时长（1s，`cubic-bezier(0.76, 0, 0.24, 1)`）做对向滑动，任意时刻两页恰好首尾相接（无缝衔接）。动画结束后（1050ms）清除旧页。旧页加 `pointer-events-none` 防止误触。

切页层以页面索引作为稳定 key，过渡开始时保留旧页的组件实例，避免 contribution graph 动画重启或重复创建 WebGL 地球。切页层使用独立合成层并限制布局、绘制影响范围。切页的 1050ms 状态窗口内暂停地球 WebGL 更新和外圈 CSS 旋转，过渡完成后从原角度继续。

### 桌面端适配

- **滚轮 / 触控板**：监听 `onWheel`，`deltaY` 方向决定切页方向；`isTransitioning` 锁防止动量余惯导致连续切页。
- **键盘**：监听 `ArrowDown/Up`、`PageDown/Up`，效果同滑动。
- 两者均遵循 `data-scroll-container` 的滚动优先逻辑。

## 统计页面设计

本章节按 `/summary` 中的展示顺序维护每一个统计页面。新增、删除或调整统计页面时，需要同步更新页面顺序、设计目标、数据来源和完成状态。

### 1. 场次概览

- **组件**：`SummaryCardOverview`
- **设计目标**：用 contribution graph 形式呈现整个巡演的时间分布，建立开场的史诗感；随后将用户自己参加的场次高亮点亮，制造专属感。
- **主要内容**：每年一张 contribution graph（2023–2026），每格代表一天；橙色格子为全部巡演场次，黄色发光格子为用户已选场次；底部显示用户参加场次总数。
- **交互方式**：图表可横向滚动；无其他交互，专注于动画演出。
- **动画逻辑**：
  1. 页面挂载后，按日期顺序以等效 15ms/场的批量更新将所有场次依次点亮（橙色），减少全量 SVG 的 React 协调次数。
  2. 3 秒后，按日期顺序以 120ms/场 将用户已选场次依次点亮（黄色 + 光晕）。
- **视觉方向**：深色背景（`zinc-950`）、橙色场次格（`#f97316`）、黄色选中格（`#fde047` + `drop-shadow` 光晕）、中文月份标签。
- **数据来源**：全量场次通过 `getSummaryData` server function 从 D1 读取（`SummaryDataContext` 提供，`useSummaryData` hook 在 `/summary` 挂载时获取一次）；用户选中场次来自 TanStack Store，在组件挂载时一次性捕获用于动画序列。
- **数据状态**：全量场次和用户选中场次均已接入，动画逻辑完整实现。

### 2. 城市地图

- **组件**：`SummaryCardCity`
- **设计目标**：用全球视角呈现 #5525 巡演覆盖的城市，建立统计回顾的空间感和开场氛围。
- **主要内容**：旋转地球、城市标记、当前城市名称、经纬度、城市序号；底部详情面板列出当前聚焦城市里用户选中的场次（日期 + 场次标签，未去过的城市显示「—」）。**全部巡演城市都有标记**（2026-07-11）：未去过的为小号灰点，去过的为大号蓝点（`#38bdf8`，与星轨同色）；**地球上不放任何文字标签**——巡演城市在国内高度密集，球面标签必然重叠，文字全部收进底部城市胶片条（同日由「球面标签」方案改为「胶片条联动」方案）。挂载时初始聚焦用户去过的第一座城市（一场未选时回落到第一座巡演城市）。有可用地点时叠加「奔波距离」星轨叙事（见下），弧线只连接去过的城市。
- **交互方式**：底部**城市胶片条**横向滚动浏览全部巡演城市（去过的白字 + 蓝色光点前缀，未去过的暗字；两侧渐隐 + 隐藏滚动条，复用嘉宾星球卡横滚不抢纵向切页手势的结论）；点选胶片后该胶片平滑滚至条中央，地球沿最短角路径缓动转向该城市（`focusPhiRef` 目标角 + 每帧 0.08 缓动，进入 0.004 rad 内吸附并恢复自转），胶片下方一行显示当前城市名 + 等宽经纬度 + `NN / 23` 序号。
- **视觉方向**：深色背景、发光地球、环形巡演文字和等宽坐标信息。蓝色 `#38bdf8` 是本卡唯一强调色（呼应「蓝色的海」），只用于星轨、出发点与公里数。
- **奔波距离星轨（2026-07-11）**：挂载时相机先对准用户出发点（`phi = 3π/2 − lng·π/180`，已用 cobe anchor 位置实测验证；theta 维持 0.2），出发点为蓝色 marker + DOM 双圈脉冲环（用 cobe 的 `--cobe-user-origin` CSS anchor 锚定）；蓝色弧线（cobe v2 原生 `arcs`）从出发点连接到每座去过的城市，挂载即完整渲染（曾实现逐条错峰生长动画，同日按产品决定移除），多城市自然交织成以用户为中心的引力场；文案两行在切页安定后约 600ms 先后淡入：「那一天，你从{A}出发，跨越了 {X,XXX} 公里，只为了奔赴那一角蓝色的海。」「你走过的所有路，都变成了舞台上亮起的逆风光。」公里数用 Doto + 蓝辉光，出发城市名去掉行政区划后缀（浙江省→浙江），城市为「不透露」「其他国家或地区」或缺失时退化为「你从家出发」。文案揭示由只在未暂停时推进的 RAF 时钟驱动（避免在切页滑动中途淡入）；`prefers-reduced-motion` 下脉冲隐藏、文案立即可见。**启用条件**：`travelOrigin` 非空且 `mileage > 0` 且至少有一座 `isVisited` 城市（弧线目标只取 isVisited 标记，绝不连未去过的城市）；不满足时卡片与无此特性时完全一致。
- **性能约束**：地球卸载时必须停止 RAF；渲染像素比最高为 1.5，避免移动端高分屏产生过大的 WebGL 帧缓冲；切页期间暂停 WebGL 绘制和装饰动画，但保留实例及旋转角度。
- **数据来源**：`getSummaryData` 返回的 `cityMarkers`（始终为全部非隐藏场次城市去重，服务端用 `city-coordinates.ts` 里的硬编码经纬度表查出，选中场次覆盖的城市带 `isVisited: true`）、`mileage` 与 `travelOrigin`（出发点坐标：浏览器定位优先，回退所选城市/地区中心）；出发城市名来自 `concertStore.profile.city`。
- **数据状态**：地球标记、底部详情面板与奔波距离星轨均已接入真实数据（headless 走查验证多城市与无地点两分支）。

### 3. 专属歌单

- **组件**：`SummaryCardPlaylist`
- **设计目标**：用随机曲目（点歌 + 安可）的出现次数排行，浮现「常驻曲」——那首在用户去过的场次里响起最多次的歌，强化「这份歌单只属于你」的排他感。视觉意象为「时光黑胶」：一张为用户限量压制的旋转唱片纪念品，而不是数据报告（2026-07-10 由排行条版重设计，见 `journey/plans/2026-07-10-playlist-vinyl-redesign.md`）。
- **主要内容**：标题「点歌与安可，替你压成一张时光黑胶。」；居中旋转黑胶唱片（签名元素）；其下 Hero 区展示常驻曲歌名（WJH 字体 + 品牌橙辉光）与文案「你去过的 N 场里，点歌与安可一共响起 X 次、Y 首不重样——而它出现了 Z 次，是这张唱片上刻得最深的一道纹」；再往下是专辑封底式 tracklist（曲序 A1–A10 + 歌名 + 点线引导 + ×N 次数，眉行「SIDE A · 出现次数 / TOP 10」）；底部注明口径「仅统计点歌与安可段落，主歌单不计入」。
- **唱片构成**（纯 CSS/SVG）：旋转层 `.summary-vinyl-disc`（`repeating-radial-gradient` 沟槽 + 三圈分轨环 + 环绕圆标的 SVG `textPath` 蚀刻文字 `MAYDAY #5525 · SIDE A · MEMORY PRESS · ONE-OFF SETLIST`，12s/转——沟槽旋转对称，蚀刻文字是旋转的视觉证据）；品牌橙圆标 + 中心孔 + 小字 5525；静止高光层 `.summary-vinyl-sheen`（conic-gradient 双侧柔光，模拟固定光源）；盘底品牌橙 box-shadow 弥散光。
- **配色规范**：品牌橙 `#f97316` 集中在圆标、hero 辉光与盘底光；tracklist 歌名与次数全部用文本色（zinc），第一名白色加粗；平票按标题排序保证 SSR 确定性。
- **动画逻辑**：唱片 wrapper 淡入 + 轻微 scale 入场（旋转在内层互不干扰）、盘面 12s 匀速旋转、tracklist 逐行错峰淡入上移，全部 compositor-only；`prefers-reduced-motion` 下停转停入场停淡入。
- **交互方式**：内容区带 `data-scroll-container`，复用容器滚动优先切页逻辑。
- **零状态**：标题「你的黑胶还是一张空白母盘」；未选场次时提示「选好你去过的场次，点歌与安可会替你刻下第一道纹」；已选场次但无点歌/安可记录时提示「这些场次还没有留下点歌与安可的记录」。
- **数据来源**：`getSummaryData` 返回的 `randomSongStats`（服务端从同一份全巡演快照按选中场次聚合，口径为 `item_type = 'song'` 且 `section = 'request'` 或 `section LIKE 'encore_%'`，与报告页 `report-stats.ts` 分段过滤一致；返回 Top 10 `entries` + `totalPlays` + `uniqueCount`）。
- **数据状态**：已接入真实数据（本地 D1 实测每场随机曲目 7–17 首，跨场次自然产生重复计数）。

### 4. 最小众歌单

- **组件**：`SummaryCardRareSongs`
- **设计目标**：专属歌单卡的镜像——统计用户听过次数**最少**的随机曲目，浮现「沧海遗珠」：那些全巡演没唱过几次、偏偏被用户撞见的冷门歌。视觉意象为「被抽中的点歌纸条」：点歌环节的歌本来就来自歌迷写的纸条，全巡演只被唱过一次的歌就是只被抽中过一次的纸条（见 `journey/plans/2026-07-10-rare-songs-card.md`；拍立得方案因与「你的回忆」卡照片意象撞车而放弃，磁带/SIDE B 方案因与前一张黑胶卡意象同族相邻而放弃）。
- **主要内容**：标题「全巡演最少被唱的歌，偏偏被你撞见。」；顶部一束品牌橙静态追光；主纸条（签名元素）——暖白纸片带两道折痕阴影与半透明橙色和纸胶带，落款「点歌纸条 · 城市 日期」（用户第一次听到它的场次）+ WJH 手写感歌名，`tourCount === 1` 时右下角盖一枚旋转橙色描边印章「仅此一次」（radial mask 做印泥不匀）；其下文案「全巡演 N 场，《X》只响起过这一次——而你，就在台下」（tourCount > 1 时改为「只响起过 Y 次——其中 Z 次，你就在台下」）；再往下 2 列小纸条网格（交替 ± 微旋转，歌名 + 「城市 · 全巡演 ×N」）；收尾句「没被唱够的歌，才最像秘密」+ 口径注脚。
- **数据口径**：与专属歌单同一随机曲目条件（`item_type = 'song'` 且 `section = 'request'` 或 `LIKE 'encore_%'`）；按用户听到次数升序 → 全巡演出现次数升序 → 标题排序，取前 7（1 主 + 6 小）。全巡演次数基于全部非隐藏场次（本地实测 45 首随机曲目全巡演只唱过 1 次）。**小众门槛**：小纸条要求全巡演出现 ≤ 8 次（约 5% 场次），否则单场用户（人人 heardCount = 1）会把《顽固》这类 ×30+ 常驻曲当成冷门曲展示；主纸条不受门槛限制（用户听过的最冷门一首永远值得展示）。
- **动画逻辑**：纸条逐张「飘落入位」（translateY + 旋转过冲收敛 + 淡入，`--i` 错峰）、追光淡入；全部 transform/opacity；`prefers-reduced-motion` 下全部停用。
- **交互方式**：内容区带 `data-scroll-container`，复用容器滚动优先切页逻辑。
- **零状态**：标题「纸条箱里还是空的」；未选场次时提示「选好你去过的场次，第一张纸条才会被抽出来」；已选场次但无记录时提示「这些场次还没有留下点歌与安可的记录」。
- **数据来源**：`getSummaryData` 返回的 `rareSongStats`（服务端从同一份全巡演快照在内存计算选中场次随机曲目、首次听到场次，以及全巡演出现次数，再合并排序）。
- **数据状态**：已接入真实数据（headless 走查验证多场/单场/零状态三分支）。

### 5. 嘉宾星球

- **组件**：`SummaryCardGuests`
- **设计目标**：以"多重宇宙 / 一期一会"的意象回顾用户与特别嘉宾的同场经历——每位嘉宾是一颗只撞见过一次的星球。
- **主要内容**：深空背景（星云渐变 + 两层平铺星点）上，按首次相遇日期排列的嘉宾星球；每颗星球带嘉宾头像（占位图）、姓名、首次相遇日期（多次相遇追加 `×N`）与城市。标题「在 5525 的多重宇宙里，有些星球你只撞见过一次。」，副标题为嘉宾计数，底部一行「这些跨次元碰撞，让属于你的那一场五月天，永远不会被复制。」。
- **零状态**：未撞见嘉宾时不用简单占位，而是居中一颗大号橙色"乐队星球"，文案「这一年你没有撞见特别嘉宾」＋「但台上的五个人，已经是一颗足够完整的星球。」。
- **交互方式**：星球排成一条**横向星域**，嘉宾多时水平滚动查看（隐藏滚动条，左右 mask 边缘渐隐暗示更多内容；≥4 颗时显示「向左滑动」提示）；少时 `min-w-full + justify-center` 自动居中。不使用 `data-scroll-container`——容器触摸翻页要求纵向位移大于横向（`SummaryContainer` 的 `handleTouchEnd`），横滑不会误触发翻页，纵滑/滚轮仍正常切页。
- **动画逻辑**：星球双轴浮动（负 delay 错峰 + 逐颗不同周期去同步；远景星球幅度更小、周期更长）、星球辉光呼吸（`::after` opacity）、两层星点反向不同速漂移（视差）+ twinkle、星云缓慢漂移缩放、约 9s 一次的流星划过；均为 compositor-only（transform/opacity）动画，因此**不需要** City 卡那样的 `isPaused`（City 是 WebGL RAF 循环才需暂停）。`prefers-reduced-motion` 下全部停止（流星基础 opacity 为 0，静止即不可见）。
- **视觉方向**：`zinc-950` 深空底色；星球用场次 `themeColor` 经 `color-mix` 着色（呼吸辉光、球面明暗遮罩、每第 3 颗加椭圆光环）；**景深分层**——每第 3 颗（`i % 3 === 1`）作远景处理（`scale .85 + opacity .7 + blur 1px`）；布局为确定性横向散布（尺寸与纵向偏移按索引查常量表 `SLOT_SIZE`/`SLOT_Y`），任意数量不重叠且 SSR 稳定。
- **关键决策**：仅展示 `isVisited === true` 场次的嘉宾——文案「与你同场」即排他性，渲染未去过场次的嘉宾会稀释情感（曾考虑用远处暗星球暗示、已否决，星空背景本身承担"擦肩而过的宇宙"意象）；嘉宾头像走 `src/pages/summary/guest-avatars.ts`：按「嘉宾名 → 图片 id」映射拼 CDN 地址（`mayday-replay-cdn.ddiu.site/5526-assets/guest/{id}.webp`），未映射的嘉宾回退到内联 SVG 占位图。
- **备选文案（未用，留存）**：「擦肩而过万千的生命，上一秒他是路人甲，下一秒撞进生命里。」
- **数据来源**：`getSummaryData` 返回的 `guestStats.guestShows`（服务端从全部非隐藏场次中筛选 `guests.length > 0` 的场次，并用用户所选场次 ID 标记 `isVisited`）；每项包含 `showDate`、基础场次展示信息、嘉宾名数组 `guests`、`isVisited`。前端按嘉宾名去重聚合多次相遇。
- **数据状态**：嘉宾与场次为真实数据；嘉宾头像已接入 CDN 真实照片（映射表覆盖的嘉宾），未映射者显示占位图。

### 6. 你的回忆

- **组件**：`SummaryCardMemories`
- **设计目标**：以长列表 + 视差滚动的形式，逐场回顾用户参加过的演出中值得纪念的内容，作为进入 /share 前的情感收束（当前为最后一张卡片，底部悬浮「生成总结」按钮压在本页上）。
- **主要内容**：每场一条回忆，包含大号日期（主题色 + 光晕）、城市/场馆/场次标签/子主题、回忆照片（配一句 caption）、一段长文字（如当晚 talking）。条目背后有超大描边幽灵序号和主题色辉光。
- **零状态**：未选择任何场次时，取全量场次前 3 场作为「示例回忆」（带「示例」徽标），文案提示这是回忆长廊的样子。
- **交互方式**：滚动容器带 `data-scroll-container`，复用容器的滚动优先切页逻辑（滚到底才能前进、滚到顶才能后退）。
- **视差实现**：未使用 CSS scroll-driven animations（Safari 覆盖不稳），而是滚动事件 + rAF 节流：每帧按「条目中心相对视口中心的偏移」把进度（[-1,1]）写入条目的 `--parallax` 变量；幽灵序号（+90px）、辉光（+140px）、照片（-36px）、引用块（-14px）以不同系数 `translateY`，形成层次。全部 transform-only。`prefers-reduced-motion` 下不挂监听且 CSS 将各层 transform 置 none。
- **视觉方向**：`zinc-950` 深色底，复用嘉宾星球的两层星点背景延续宇宙氛围；所有主题色效果由场次 `themeColor` 通过 `--memory-color` 驱动（日期颜色/光晕、辉光、caption 左边线、引用符、占位图渐变）；照片占位框带周期性斜向扫光（transform-only ::after），交替微倾斜。
- **数据来源**：条目由 `SummaryDataContext` 的 `selectedShows` 按日期排序生成（每场一条）；照片、caption、talking 均为占位（常量表循环取用）。
- **数据状态**：场次信息为真实数据；照片与文字内容全部为占位，真实回忆数据的来源和建模（用户上传 / 运营维护的场次 talking 精选）尚未确定。

## 报告页「你的专属报告」（/report）

- **组件**：`src/pages/report/`（`ReportPage` TanStack AI 聊天 UI、`ReportCard` 结果卡片、`report-schema.ts` 结构化卡片 schema）；入口为 `/share` 页的「你的专属报告」按钮。
- **定位**：AI 自然语言查询入口。用户输入统计问题后，前端通过 `@tanstack/ai-react` 的 `useChat` 连接 `/api/report-chat`，服务端用 TanStack AI `chat()`、OpenAI-compatible adapter 和 D1 统计工具生成一张数据卡片。
- **模型配置**：页面不暴露模型选择；服务端通过 `REPORT_AI_BASE_URL`、`REPORT_AI_API_KEY`、`REPORT_AI_MODEL` 和可选 `REPORT_AI_PROVIDER_NAME` 配置 OpenAI-compatible 模型。密钥只在服务端读取。
- **统计边界**：AI 不能自由生成 SQL；只能调用受控工具：出席概览、城市排行、歌曲排行、单曲时间线、嘉宾排行。工具默认基于用户已选场次 ID 查询 D1；当用户明确询问「所有场次 / 全巡演 / 全部场次」时，同一套统计维度可切换到所有未隐藏场次。**每种统计工具**都支持可选时间过滤：含端点的 `startDate` / `endDate`（`YYYY-MM-DD`），以及跨年份的 `month`（1–12）或 `season`（春夏秋冬）；可与场次范围、歌曲主歌单/点歌/安可分段组合。歌曲类工具还支持主歌单、点歌、安可分段过滤，所以「所有场次中唱过最多的点歌」会走全场次 + 点歌分段统计。空选择且未要求全场次时生成提示用户先选场次的零状态卡片。由于当前 OpenAI-compatible 模型端（如 DeepSeek）不一定支持 `response_format`，服务端不把 `outputSchema` 传给 provider，而是要求模型输出 JSON 文本，服务端用 `ReportCardSchema` 校验后再合成为 TanStack AI structured-output SSE 事件给客户端。
- **文件组织**：`src/routes/api.report-chat.ts` 只保留 TanStack Start route 壳；`src/server/report-chat.ts` 组装一次请求；`src/server/report-prompt.ts` 维护支持维度和系统提示词；`src/server/report-stream.ts` 负责 JSON 文本解析、schema 校验和 structured-output SSE 合成；`src/server/report-stats.ts` / `report-tools.ts` 负责 D1 聚合和 TanStack AI 工具定义。
- **卡片形态**：保留原效果图的两种展示：排行条和日期时间线；卡片含问题复述、主答案、口径脚注和「实时统计」徽标。主答案数字用 Doto 点阵体，中文用 WJH，themeColor 驱动辉光。
- **动画与状态**：卡片继续使用「热敏打印」clip-path 显现，排行条随后生长；消息入场轻微上滑淡入；工具调用期间显示逐步点亮的计算状态；`prefers-reduced-motion` 下动画停用。

## 待确认与后续工作

- 设计统计页面内的视差或滚动动画。
- 评估使用 `html2canvas` 或同类方案生成分享图片。
- 扩展报告页统计工具覆盖面，并为 AI 输出增加更系统的回归测试。
