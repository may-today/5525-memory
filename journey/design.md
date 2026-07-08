# 5525 Memory 设计文档

## 项目定位

5525 Memory 是一个移动端优先的五月天 #5525 巡回演唱会回顾网页应用。用户选择自己参加过的场次后，应用会生成可视化、可分享的个人巡演总结。

## 当前状态（2026-06-20）

项目已迁移至 TanStack Start，完整页面流程可以正常跳转。表单使用真实场次目录，并为后续统计流程保存用户选择的场次 ID。统计页面新增「场次概览」作为首屏，使用 contribution graph 动画呈现全部巡演场次及用户已选场次；其余统计页面的框架和部分视觉效果已完成，真实统计逻辑仍待接入。

## 技术架构

- **应用框架**：TanStack Start + React 19 + Vite + TypeScript
- **样式方案**：Tailwind CSS 4 + shadcn
- **路由方案**：TanStack Router 文件路由与服务端渲染
- **部署环境**：通过 Cloudflare Vite 插件部署至 Cloudflare Workers

## 页面流程

```text
/（封面）→ /form（场次选择）→ /loading（生成过渡）→ /summary（统计回顾）→ /share（分享）
```

## 关键设计决策

### 使用标准路径与服务端渲染

Cloudflare Workers 负责处理直接路由请求，因此页面使用 `/form` 等标准路径，而不是哈希路由。根路由统一管理 HTML 文档、共享布局和主题提供器。

### 使用 Cloudflare Workers 运行时

应用通过 Cloudflare Vite 插件使用 TanStack Start 默认服务端入口。Wrangler 已启用 `nodejs_compat` 和可观测性，并绑定了 Cloudflare D1（见下方「场次数据与 D1」）。

### 场次数据与 D1（2026-07-08）

场次、歌单、巡演城市等数据已从 `data/shows.json` 迁移进 Cloudflare D1（`5525-memory-db`），不再把 `raw-data/` 的原始导出直接暴露给前端。数据访问收敛成 `src/server/*.ts` 里的少数 server function（`getAllShows`、`getSummaryData`），后者一次性返回 `/summary` 各卡片需要的全部数据（Overview/City/Card1/Card3/嘉宾统计；Card2 里程暂缓）。城市经纬度未建表，作为常量写在 `src/server/city-coordinates.ts`，只被 server function 引用。详见 `journey/plans/2026-07-08-d1-data-migration.md`。

表单按城市对可见场次分组并支持多选。已选择的完整场次对象保存在 TanStack Store 中，供路由间的组件全局订阅；store 每次变更都会将所选数字 ID 以 `concert-form-data:v1` 为键同步到 `localStorage`，`/form` 在拿到场次目录后会用这些 ID 恢复选择。`/summary` 挂载时通过 `useSummaryData` hook 优先用 store，其次用 `localStorage` 里的 ID 换回完整场次数据，解决了硬刷新丢失选中场次的问题。

**本地开发**：D1 的本地状态是每台机器独立的 SQLite 文件（`.wrangler/state/v3/d1`，已 gitignore），完全由 Miniflare 模拟，不需要 Cloudflare 账号权限。新拉仓库或换机器只需要 `bunx wrangler d1 migrations apply 5525-memory-db --local` 再 `bun run dev`。

**多人协作**：`migrations/` 下的文件一旦被应用过就不能再改，schema 或数据的任何调整都通过 `wrangler d1 migrations create 5525-memory-db <name>` 新增下一个编号的文件；谁拉到新 migration 就本地重新 apply 一次即可，`wrangler` 只会应用尚未跑过的文件。

**远程（生产）D1**：迁移应用方式目前选择手动执行——有权限的人在需要发布时手动跑 `wrangler d1 migrations apply 5525-memory-db --remote`，再 `bun run deploy`。规模变大或发布频率变高后可以再考虑接入 CI 自动化。

### 统计回顾使用单路由和内部状态

`/summary` 渲染 `SummaryContainer`，由其通过 `currentIndex` 管理当前统计页面。每个统计页面是独立组件，而不是独立路由，以便实现切换动画，并避免滑动手势导致 URL 频繁变化。

### 竖向切页与页面内纵向滚动的优先级

`SummaryContainer` 使用竖向滑动（上下）切换统计页面：`|deltaY| > |deltaX|` 且 `|deltaY| >= 40` 时触发切页。每页底部中心悬浮展示"滑动探索"引导箭头（最后一页替换为"生成总结"按钮），无页面圆点指示器。

需要页内纵向滚动的统计页（`SummaryCardOverview`、`SummaryCard1`）在可滚动区域加 `data-scroll-container` 属性。切页前，`SummaryContainer` 检查该元素是否已滚动到底部（前进）或顶部（后退），未到则不切页，内部滚动优先。

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
- **主要内容**：旋转地球、城市标记、当前城市名称、经纬度、城市序号；底部详情面板列出当前聚焦城市里用户选中的场次（日期 + 场次标签）。
- **交互方式**：点击城市标记切换当前城市；使用底部左右按钮循环浏览城市。
- **视觉方向**：深色背景、发光地球、环形巡演文字和等宽坐标信息。
- **性能约束**：地球卸载时必须停止 RAF；渲染像素比最高为 1.5，避免移动端高分屏产生过大的 WebGL 帧缓冲；切页期间暂停 WebGL 绘制和装饰动画，但保留实例及旋转角度。
- **数据来源**：`getSummaryData` 返回的 `cityMarkers`（按用户选中场次的城市去重后，服务端用 `city-coordinates.ts` 里的硬编码经纬度表查出；未选择任何场次时兜底展示全部巡演城市）。
- **数据状态**：地球标记和底部详情面板均已接入真实数据。

### 4. 场次回顾

- **组件**：`SummaryCard1`
- **设计目标**：概括用户参加 #5525 巡演的整体规模。
- **主要内容**：参加总场次、到访城市数，以及后续扩展的场次统计项。
- **交互方式**：内容较长时支持页面内纵向滚动。
- **数据来源**：`getSummaryData` 返回的 `overview`（总场次/城市数/场馆数，服务端按用户选中场次聚合）。
- **数据状态**：总场次、城市数已接入真实数据；其余 6 个扩展统计项仍为占位值，尚未实现。

### 5. 里程追踪

- **组件**：`SummaryCard2`
- **设计目标**：用旅途距离呈现用户追随巡演的投入和跨城经历。
- **主要内容**：估算总里程、距离最远的城市。
- **数据来源**：待明确用户出发地、城市坐标和里程计算规则后，由所选场次计算。
- **数据状态**：当前均为占位值；出发地采集方式和距离口径尚未确定（D1 里的城市经纬度已具备，缺的是出发地采集入口）。

### 6. 歌曲回顾

- **组件**：`SummaryCard3`
- **设计目标**：从曲目角度回顾用户在所选场次中听到的内容。
- **主要内容**：听到的歌曲总数、出现次数最多的歌曲。
- **数据来源**：`getSummaryData` 返回的 `songStats`（服务端对 D1 `setlist_items` 按选中场次 ID 聚合，口径为 `item_type='song'`，含安可段落、排除串烧/VCR/talking 等非歌曲条目）。
- **数据状态**：总歌曲数、最常出现的歌均已接入真实数据。

### 7. 嘉宾星球

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

## 待确认与后续工作

- 确定里程统计的出发地采集方式与计算口径（D1 城市经纬度已就绪）。
- 设计统计页面内的视差或滚动动画。
- 评估使用 `html2canvas` 或同类方案生成分享图片。
- 评估在统计数据之上接入 AI 自然语言查询能力（用户输入想探索的统计项，如「秋天唱过最多的歌」）。
