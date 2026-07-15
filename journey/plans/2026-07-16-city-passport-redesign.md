# 计划：城市卡改版为「城市护照全息」

日期：2026-07-16

## 背景

`SummaryCardCity`（`/summary` 第 3 张卡）目前用 cobe 3D 地球 + 星轨弧线展示巡演城市。问题：
23 个巡演城市里有 17 个挤在中国大陆（见 `src/server/city-coordinates.ts`），地球转动时城市点
彼此重叠、看不清楚，3D 投影对高密度单一地区的数据不友好。同时第一张卡（时间轴）已经用「彩色
星图」讲了时间维度的故事，城市卡的差异化定位应落在**空间/足迹**，而非再叠一层时间序列。

用户已确认方向：放弃地图/地球隐喻，改为**不做地图的护照卡组**——横滑卡组，一城一张，去过的
城市点亮、未去过的呈灰色剪影「收藏目标」。

**2026-07-16 更新**：原计划用场馆 3D 透明素材做主视觉，用户决定暂不接入图片素材，改用纯
CSS/SVG 绘制的「护照印章」代替（见下方「视觉核心元素」）——这其实比照片更贴合"护照"这个比喻本身
（真实护照上盖的是印章，不是航站楼照片），也让本卡完全不依赖外部图片资产。同时补充展示
`subTheme`（子巡演主题）与 `versionName`（版本名）信息。

## 已确认的设计决策

1. **不使用图片素材**：暂不接入场馆 3D 透明图，视觉核心元素改为纯 SVG 绘制的护照印章（见
   下方「视觉核心元素：护照印章」），不依赖任何外部图片资产，也不存在"素材缺失兜底"的问题。
2. **卡组默认顺序**：去过的城市优先展示，未去过的城市排在后面，作为「收藏目标」引导用户对照
   自己的巡演足迹。同一分组内部按场次日期顺序排列（与 `/records` 的时间线逻辑保持一致，方便
   用户对照回忆）。
3. **横滑手势**：卡组内部横滑与 `/summary` 容器的纵向翻页手势不冲突——参考
   `SummaryCardDuration` / `SummaryCardSongWall` 已有的 `data-summary-gesture-exempt` 机制，
   在卡组容器上标记该属性，让内部横滑独立于外层纵向切卡手势。

## 数据流改动

`CityMarker`（`src/server/summary.ts`）目前只有 `cityName / isVisited / latitude / longitude`，
是为地球 marker 设计的，护照卡组不再需要经纬度，但需要更多叙事字段：

- 新增 `venue: string`（该城市的代表场馆名，用于印章环形文字与卡片副标题）。
- 新增 `subTheme: string`（该城市代表场次的子巡演主题，如「5525回到1999」，用作印章「墨色」——
  复用 `SummaryCardOverview.tsx` 已有的 `SUB_THEME_COLORS`：5525 粉 `#f472b6`、5525+1 蓝
  `#38bdf8`、5525+2 橙 `#fb923c`，未知子主题回退场次 `themeColor`，与全站着色语汇保持一致）。
- 新增 `versionName: string`（版本名，与 `subTheme` 一起用 `[subTheme, versionName].filter(Boolean).join(' · ')`
  组合展示——这是 `RecordsTimeline.tsx:149` 已有的拼接约定，直接复用而不是发明新格式）。
- 新增 `showDates: string[]`（该城市所有巡演日期，`dateSlash` 格式，用于展示「已点亮」的具体
  日期；未去过的城市可为空数组或不展示）。
- 新增 `visitedShowDates: string[]`（用户在该城市实际选中的场次日期子集，用于「已点亮 N 场」
  文案；`isVisited` 可由其长度 > 0 派生，视需要保留布尔字段做兼容）。
- `buildCityMarkers` 改为按 `allShows` 分组聚合（同城市可能有多场次/多子主题——如某城市同时
  出现在 5525 与 5525+1 两段巡演里，需要决定 `subTheme`/`venue`/`versionName` 取哪一条代表：
  已去过的城市取用户实际去过的那场（若去过多场取时间最早的一场），未去过的城市取该城市首次出现
  的场次），保留去重后的城市列表，但携带以上聚合信息；排序仍按城市首次出现的场次日期（与现有
  `uniqueCities` 顺序一致），前端再按「已去过优先」重新分组，不改变服务端的时间序。

不再需要 `travelOrigin` 用于本卡（该字段服务于星轨弧线，护照卡组不用地图/弧线）。需确认
`mileage` 文案是否迁移到别处或保留在本卡作为纯文本（不影响其独立于地球渲染）——本卡头部仍可
保留「你去了 N 个城市，从 A 出发跨越 X 公里」这句已经写好的叙事文案，只是不再依赖地球渲染。

## 视觉核心元素：护照印章

不用图片，改用纯 SVG 绘制的「护照印章」作为每张城市卡的视觉中心，比场馆照片更贴合「护照」
这个比喻——真实护照上盖的是圆形/椭圆形墨色印章，不是航站楼照片。

- **形状**：圆形徽章，直径占卡片宽度的大部分（视觉权重取代原计划的场馆图）。
- **墨色**：取该城市 `subTheme` 对应的 `SUB_THEME_COLORS`（粉/蓝/橙），去过的城市满色描边 +
  轻微辉光（`drop-shadow`），未去过的城市降为**空心虚线描边 + 灰度**，读作"还没盖上的护照页"，
  比灰色剪影更贴合"护照"叙事，也不需要额外的兜底图像资源。
- **环形文字**：直接复用现有 `.summary-globe-orbit-ring` 的 SVG `textPath` 环形文字实现（当前
  内容是 "5525 MAYDAY · " 重复），把内容换成 `[subTheme, versionName, venue].filter(Boolean).join(' · ')`
  沿圆周重复排列——复用已验证的组件而不是重新发明一套环形文字渲染。
- **中心**：城市名（`font-title` / WJH，大号）。
- **邮戳日期条**：去过的城市在印章上叠一条斜切的日期横条（Doto 数字 + 深色底），模拟真实邮戳
  盖章的「取消线」效果，展示 `visitedShowDates`（多场取「以及另外 N 场」的补充小字）；未去过
  的城市不渲染这条日期横条（因为没有可盖的日期）。

## 视觉与交互

- **头部**：eyebrow `CITY · 你的巡演城市` + 标题，沿用现有 Doto 数字 + 蓝色辉光讲「你去了
  N / 23 个城市」的计数句（与 overview 卡「时间坐标」计数句同一视觉语汇，呼应但不重复）。
- **卡组**：横向滑动，一屏一城；每张卡：
  - 中央「护照印章」（见上一节），取代原计划的场馆图。
  - 印章下方一行小字信息：`venue` 场馆名 + `[subTheme, versionName]` 组合标签（复用
    `RecordsTimeline.tsx:149` 的拼接约定），已点亮的城市额外显示日期，未点亮显示「未解锁」或
    引导文案。
  - 底部进度点（dots）指示当前在卡组中的位置，去过的点用对应 `subTheme` 色实心，未去过用空心，
    可直接点击跳转（复用 songwall/album progress 卡已有的 dots 交互模式，若存在可复用组件）。
- **手势**：卡组容器 `data-summary-gesture-exempt`，内部实现横向 swipe（触摸 + 可选按钮），
  不使用地球/地图渲染，不引入 cobe 依赖（本卡改版后可能整体移除 cobe，需确认无其他卡片使用
  该库后再清理 `package.json` 依赖）。
- **reduced-motion**：辉光/入场动效降级为静态显示，不做强制要求的入场动画（护照卡组本身动效
  比地球弧线简单很多，风险较低）。

## 改动文件（预期）

1. `src/server/summary.ts` — `CityMarker` 字段扩展（`venue`/`subTheme`/`versionName`/
   `showDates`/`visitedShowDates`）、`buildCityMarkers` 聚合逻辑改写。
2. `src/pages/summary/cards/SummaryCardCity.tsx` — 整体重写：移除 cobe 地球渲染，改为横滑护照
   卡组 + SVG 印章；`SUB_THEME_COLORS` 从 `SummaryCardOverview.tsx` 提取为共享常量（两处都要用，
   避免复制粘贴出现两份不同步的配色表）。
3. `src/index.css` — 移除 `.summary-globe-*` 相关样式，新增护照卡组 + 印章样式（环形文字部分
   基于现有 `.summary-globe-orbit-ring` / `.summary-globe-orbit-svg` 改名迁移，不是重写）。
4. 若确认无其他卡片依赖 cobe：从 `package.json` 移除 `cobe` 依赖。
5. `journey/design.md` — 更新城市卡章节描述。

## 待办 / 开放问题

- 确认 `SUB_THEME_COLORS` 提取为共享常量后放在哪个文件（如新建 `src/lib/sub-theme-colors.ts`），
  避免 `SummaryCardOverview.tsx` 与 `SummaryCardCity.tsx` 各自维护一份。
- 确认 `mileage` 叙事文案在新版头部是否保留原句式，或简化为纯计数句（护照卡组不再有地球/
  弧线可视化里程，文案需要独立成立）。
- 确认「去过优先排序」是否需要在卡组内部额外做一次视觉分隔（如去过/未去过之间插入一条分割
  提示"以下是你还没点亮的城市"），避免用户滑动中途才意识到进入了未去过分组。
- 确认同城市跨子主题时（如某城市同时出现在 5525 与 5525+1 两段巡演），印章代表哪一场的规则
  （见「数据流改动」——已去过取用户去过的那场，未去过取该城市首次出现的场次）是否符合预期。

## 验证

- `bun run typecheck` + `bun run lint`。
- `bun run dev` 浏览器走查：横滑手势与纵向翻页手势互不干扰、去过/未去过印章视觉区分（实心 vs
  虚线空心）、跨子主题城市的印章内容是否符合预期、reduced-motion、`git diff --check`。
