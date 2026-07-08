# 2026-07-08 嘉宾星球统计卡片

## 目标

在 `/summary` 新增最后一张卡片「嘉宾星球」:深空宇宙背景 + 漂浮星球,每颗星球代表一位与用户同场的嘉宾,标注姓名与相遇日期。数据侧已由同日的 guest-summary-stats 工作接入(`getSummaryData().guestStats.guestShows`),本次为纯前端实现。

## 关键决策

- 仅展示 `isVisited === true` 场次的嘉宾:文案「与你同场」即排他性;未去过场次的嘉宾不渲染,星空背景承担"擦肩而过的宇宙"意象。
- 每颗星球 = 一位嘉宾(按名字去重聚合多次相遇);日期标签显示首次相遇 `dateSlash`,多次追加 `×N`。
- 布局用确定性 zigzag 流式布局(每星球一个 flex 行,水平偏移/尺寸按 `i % len` 查常量表),任意数量不重叠,超屏走现有 `data-scroll-container` 内部滚动。
- 星空为纯 CSS 平铺 radial-gradient 星点(互质 background-size,两层,一层 twinkle),不用 canvas。
- 卡片保持零 props,无需 City 式 `isPaused`:动画均为 compositor-only transform/opacity。
- 嘉宾头像建立 `guest-avatars.ts` data-URI 占位约定,真实照片后续填充。
- 文案:标题「在 5525 的多重宇宙里,有些星球你只撞见过一次。」;副标题「今年,有 {N} 位嘉宾与你同场。」;底部「这些跨次元碰撞,让属于你的那一场五月天,永远不会被复制。」;零状态「这一年你没有撞见特别嘉宾」+「但台上的五个人,已经是一颗足够完整的星球。」(居中一颗大号乐队星球)。

## 改动文件

- 新增 `src/pages/summary/guest-avatars.ts`(头像占位约定)
- 新增 `src/pages/summary/cards/SummaryCardGuests.tsx`(聚合 + 卡片)
- `src/index.css`(星空/星球/浮动 keyframes + reduced-motion 点名)
- `src/pages/summary/SummaryContainer.tsx`(CARDS 末尾注册)
- `journey/design.md`(`### 嘉宾统计` → `### 7. 嘉宾星球`,补全设计条目)

## 验证

`bun run check`、`bun run build`;dev 下分别验证有嘉宾/无嘉宾/未选场次三种状态、320px 竖屏无溢出、多嘉宾内部滚动、reduced-motion 降级。

## v2 迭代(同日,用户反馈)

用户希望更酷炫、更有空间感,且嘉宾多时横向扩展。改动:

- 布局从纵向 zigzag 改为**横向星域**:`overflow-x-auto` 水平滚动(隐藏滚动条 + 左右 mask 边缘渐隐),内部 `flex w-max min-w-full justify-center`——少时居中、多时横向扩展;纵向散布按 `SLOT_Y` 常量表;移除 `data-scroll-container`(容器触摸翻页要求纵向位移 > 横向,横滑无冲突)。
- 景深分层:每第 3 颗星球作远景(`scale .85 / opacity .7 / blur 1px`,浮动更慢更小)。
- 动画增强:双轴浮动、星球辉光呼吸(`::after` opacity)、两层星点反向漂移视差、星云漂移缩放、约 9s 一次流星;全部 compositor-only,reduced-motion 点名停用。
- ≥4 颗星球时显示「向左滑动，探索更多星球 →」提示。
