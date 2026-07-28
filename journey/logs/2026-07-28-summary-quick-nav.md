# 2026-07-28 /summary「航线图」快捷跳转

## 做了什么

- 新增 `src/pages/summary/summary-cards.ts`：把 Container 里的 `CARDS` 升级成
  `SUMMARY_CARDS`（`Component` + 短标题 + 一句说明），容器与航线图共用一份清单。
- 新增 `src/pages/summary/SummaryQuickNav.tsx`：右下角圆形罗盘按钮 + 底部 Sheet
  「航线图」，列表可滚动，当前站点亮。
- `SummaryContainer`：`goForward` / `goBack` 收敛为 `goTo(index)`；新增
  `isQuickNavOpen`，与 `isDetailOpen` 一起屏蔽方向键并隐藏底部滑动引导。
- `index.css`：新增 `.summary-quicknav-*`（FAB 玻璃底、行 hover、当前站 sky 点亮）。

## 中途改过的方向

1. 一开始理解成跳转到 `/`、`/share`、`/records` 这类框架页，做成了右下角自绘的
   浮层面板。用户纠正：跳的是**统计页之间**，形态改成从底部弹起的 Sheet，
   并且要求列表在页数变多时可滚动。于是复用了时长卡已有的 Sheet 形态，
   自绘面板与它的入场动画、背板 CSS 全部删掉。
2. Sheet 标题最初写「跳到哪一页」，太直白；改为「航线图」，呼应罗盘图标与全站
   「星轨 / 航道 / 站点」语汇。连带把第 2 张卡在列表里的短标题从「时光机航线」
   改成「时光机隧道」，避开与标题字面重复。

## 状态

`bun run typecheck` 通过；`bunx ultracite check` 对新增/改动文件干净（
`SummaryContainer` 里 `noVoid`、`useExhaustiveDependencies` 两条是本次之前就有的）。
**尚未在真实浏览器里验证**（本次没有跑 `verify` 流程）。下次接手时值得实测：
罗盘按钮在地球卡、极光卡上的可辨识度，以及跳转动画在跨多页时的观感。
