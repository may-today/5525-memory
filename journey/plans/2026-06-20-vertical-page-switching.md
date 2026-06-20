---
date: 2026-06-20
title: 统计页竖向切页 Layout
---

## 目标

将 `/summary` 的统计页切换方向从横向（左右滑动）改为纵向（上下滑动），并在每页底部中心悬浮展示引导箭头。内部有 scrollView 的页面，滚动优先，到底部后才触发切页。

## 核心变更

### SummaryContainer

- 外层：`relative h-svh overflow-hidden`，`onTouchStart/End` 事件挂在此处
- 卡片包装层：`h-full overflow-hidden`，持有 `cardWrapperRef`
- 竖向滑动检测：`|deltaY| > |deltaX|` 且 `|deltaY| >= 40`
- `canAdvanceForward()`：查找 `[data-scroll-container]`；无则直接放行，有则检查 `scrollTop + clientHeight >= scrollHeight - 10`
- `canGoBack()`：同上，检查 `scrollTop <= 10`
- 底部悬浮层：`pointer-events-none absolute inset-x-0 bottom-0`，含"滑动探索" + ChevronDown + 页面圆点；最后一页改为"生成总结"按钮
- 移除原有底部导航栏

### SummaryCardOverview

- 根元素：`flex h-svh flex-col bg-zinc-950`
- header（label + h1）：`shrink-0 px-6 pt-8 pb-4`
- 内容区（年份图 + 统计）：`flex-1 overflow-y-auto px-6 pb-24` 加 `data-scroll-container`

### SummaryCard1

- 根元素：`flex h-svh flex-col`
- header（label + h3）：`shrink-0 px-6 pt-6`
- 内容区（统计列表）：`flex-1 overflow-y-auto px-6 pt-4 pb-24` 加 `data-scroll-container`

### SummaryCardCity / Card2 / Card3

- 无需变更（City 已是 `h-svh`；Card2/Card3 内容少，`min-h-svh` 在 `overflow-hidden` 容器中等效）

## 文件

- `src/pages/summary/SummaryContainer.tsx` — 主要重写
- `src/pages/summary/cards/SummaryCardOverview.tsx` — 加内部滚动
- `src/pages/summary/cards/SummaryCard1.tsx` — 加内部滚动
