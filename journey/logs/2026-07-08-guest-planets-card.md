# 2026-07-08 嘉宾星球卡片实现日志

## v1:基础卡片

- 新增 `src/pages/summary/guest-avatars.ts`:data-URI 头像占位约定(按嘉宾名键控 + 共享 SVG 占位回退;真实照片建议 webp ≤8KB,过大迁 `public/`)。
- 新增 `src/pages/summary/cards/SummaryCardGuests.tsx`:`buildGuestPlanets` 过滤 `isVisited` 场次、按嘉宾名去重聚合多次相遇,按首次相遇日期排序;纵向 zigzag 布局;零状态为居中橙色"乐队星球" + 「足够完整的星球」文案。
- `src/index.css`:纯 CSS 平铺星点背景(互质 background-size)、星球球面明暗遮罩、浮动/twinkle keyframes、reduced-motion 点名停用。
- `SummaryContainer.tsx` CARDS 末尾注册;卡片零 props,无需 `isPaused`(动画均 compositor-only)。
- 验证:`tsc -b` 通过、`bun run build` 通过;Biome 对本次文件无错误(存量 21 个错误在未触碰文件)。

## v2:横向星域(用户反馈:更酷炫、有空间感;嘉宾多时水平滚动)

- 布局重构:横向星域,`overflow-x-auto`(隐藏滚动条,左右 mask 渐隐),内部 `flex w-max min-w-full justify-center`——星球少时居中、多时横向扩展滚动;纵向散布走 `SLOT_Y` 常量表;移除 `data-scroll-container`。
  - 交互确认:`SummaryContainer.handleTouchEnd` 要求 `|deltaY| > |deltaX|` 才翻页,横滑不冲突;横向滚动区 `scrollHeight == clientHeight`,纵向翻页门控恒通过。
- 景深:`i % 3 === 1` 星球远景处理(scale/opacity/blur + 更慢浮动);光环仍在 `i % 3 === 2`。
- 动画增强:双轴浮动、辉光呼吸(`.summary-guest-planet::after`,`isolation: isolate` 防止负 z 光晕沉到卡片背景后)、两层星点反向不同速漂移(层外扩 -80px 防露边)、星云漂移缩放、流星(基础 opacity 0,reduced-motion 下静止即不可见)。
- ≥4 颗星球显示「向左滑动」提示(SSR 无法测量溢出,用数量阈值近似)。

## 头像逻辑调整(用户手改)

- `guest-avatars.ts` 从 data-URI 预编码方案改为 CDN 方案:`guestImgIdMap` 维护「嘉宾名 → 图片 id」映射,`getGuestAvatar` 拼 `//mayday-replay-cdn.ddiu.site/5526-assets/guest/{id}.webp`;未映射嘉宾仍回退内联 SVG 占位图。已同步 design.md 与文件头注释。
