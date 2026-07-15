# 日志：城市护照卡 UI 精修 + 护照首页 + 彩虹印台渐变

日期：2026-07-16 · 计划：`journey/plans/2026-07-16-city-passport-polish.md`

## 完成内容

- **护照首页**（卡组 index 0）：eyebrow / Doto 分数（`08 / 23` 式）/ 5 列迷你印章
  网格（点按 RAF 平滑翻页跳转）/ 真实数据 MRZ 机读码两行；城市页顺延为 index 1..N。
- **印章精修**：外圈细环 + 机刻刻线圈（双圈结构）、±4° 固定微倾角、印泥不匀 mask、
  盖章 slam 动画（IO 首次激活触发一次性 `data-stamped`，邮戳延迟落下）、环境光
  `@property --city-ambient` 颜色过渡。
- **彩虹印台渐变**（用户确认方案）：`CityMarker.subThemes` + SVG `linearGradient`，
  跨子主题城市（10/23 城）印章墨色为多段渐变，单主题退化纯色。
- 页头叙事数字 Doto 化；dots 增加首页「书页」指示、按子主题首色着色。

## 走查中发现的问题（均已修复）

1. Chrome 在 `scroll-snap-type: x mandatory` 容器上中途取消原生 smooth 滚动
   （停在 328.5px 等非 snap 位置；禁 snap 后可完成）——**既有 bug**，改 RAF 自绘缓动
   （动画期临时关 snap，reduced-motion 瞬时跳转）。
2. 邮戳条居中定位完全盖住城市名——**既有 bug**，移到 66% 高度。
3. dots 行与 SummaryContainer 悬浮引导重叠——`pb-8` → `pb-20`。
4. 未盖章城市环境光误用主题色——改中性灰。
5. 香港存在 `sub_theme` 为空的场次记录，`subThemes` 聚合时过滤。

## 验证

- `bun run typecheck` ✓；`bun run lint` 无本次改动相关报错（仓库存量报错另计）。
- 浏览器走查（台中 4 场种子数据）：护照首页网格/分数/MRZ、台中渐变印章（粉→蓝）
  与邮戳位、高雄/吉隆坡灰章、跨 22 页 RAF 翻页、dots 与环境光切换、纵向切卡不受
  横滑影响。reduced-motion 走 CSS 停用清单（未单独浏览器模拟）。

## 未做 / 留待后续

- `src/data/stadium.ts`（场馆图 CDN 映射）保留未引用——「暂不接入图片素材」决策不变。
- cobe 依赖是否可从 `package.json` 移除未在本次处理（改版前已移除使用，需确认无他卡引用）。
