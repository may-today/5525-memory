# /summary 右下角「航线图」快捷跳转

## 目标

在统计页右下角放一个悬浮按钮，点击从底部弹起 Sheet，列出全部统计页，点一下直达。
列表每一项是「序号 + 标题 + 一句简短说明」；页数增多时列表本身可滚动。

跳转的是**统计页之间**（10 张卡片），不是 `/`、`/share` 这类框架页。

## 现状约束

- `/summary` 由 `SummaryContainer` 单路由承载，10 张卡片靠上下滑动切页；容器在
  `onTouchStart/End`、`onWheel` 和 window `keydown` 上做手势与键盘切页。
- 容器已有 `isInsideGestureExemptOverlay()`：任何带 `data-summary-gesture-exempt`
  的子树冒泡上来的 touch / wheel 都会被忽略（时长卡的 Sheet 已在用同一套）。
- 切页只有 `goForward` / `goBack` 两个相邻步进，没有跳转到任意页的能力。
- 底部中央已有悬浮引导（非末页「滑动探索」箭头 / 末页「生成总结」按钮），
  水平居中；新按钮放右下角不与其重叠（窄至 320px 也不重叠）。

## 方案

### 卡片清单收敛成单一数据源

新增 `src/pages/summary/summary-cards.ts`，把原先 `SummaryContainer` 里的 `CARDS`
数组升级为 `SUMMARY_CARDS: { Component, title, description }[]`。容器按它渲染，
航线图按它出列表，新增一张卡只需要在这一处声明。放独立模块也避开了
「Container → QuickNav → Container」的循环依赖（沿用 `summary-card-props.ts` 先例）。

`title` 是给航线图用的短标签，不是卡片自己的整句大标题；`description` 是一句
说明这张卡在讲什么的短文案。

### 任意页跳转

`goForward` / `goBack` 收敛为 `goTo(index)`：方向由 `index > currentIndex` 决定，
其余（animState、`isTransitioning` 锁、1050ms 清理）完全复用既有切页动画，
所以跳几页和滑一页看起来是同一个动作。越界与原地跳转直接返回。

### 悬浮按钮与 Sheet

新增 `src/pages/summary/SummaryQuickNav.tsx`，由 `SummaryContainer` 在卡片层与底部
引导之后渲染。

- 触发器是圆形罗盘按钮（`absolute right-5 bottom-8 z-20`），沿用 `/records`、
  `/data-station` 返回按钮的圆形玻璃语言，自带模糊与深投影，压在地球、极光这类
  高对比卡片上也认得出来。
- 点开是复用 `components/ui/sheet` 的底部 Sheet（与时长卡「查看全部场次」同一形态），
  标题「航线图」；列表 `max-h-[72svh]` + 内部 `overflow-y-auto overscroll-contain`，
  之后卡片变多也只滚列表自身。
- 触发器与 SheetContent 都带 `data-summary-gesture-exempt`：点按钮不会顺手翻页，
  Sheet 内滚动也不会冒泡成切页。
- 展开状态提到容器的 `isQuickNavOpen`，与 `isDetailOpen` 一起屏蔽方向键切页并隐藏
  底部滑动引导，避免两处悬浮元素同时出现。
- 当前所在站整行以 sky 色温点亮并带对勾，点它只关 Sheet 不触发动画。

### 文案

标题「航线图」，列表项序号用 Doto（`font-geist`）。「站」的说法与表单页城市站号、
专辑年表站点一脉相承，也呼应罗盘图标。第 2 张卡在航线图里叫「时光机隧道」，
避开与「航线图」本身的字面重复。

## 不做

- 不改切页手势判定本身，只借用既有的 exempt 机制与切页动画。
- 不做跨路由（`/share`、`/records` 等）入口——那些是框架页，不属于这趟航线。
