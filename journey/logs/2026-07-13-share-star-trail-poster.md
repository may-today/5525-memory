# /share「星轨共振」海报实现记录

计划：`journey/plans/2026-07-13-share-star-trail-poster.md`

## 完成内容

- 新增 `src/pages/share/SharePoster.tsx`：星轨海报组件，含星座布局、Catmull-Rom
  平滑星轨、孤勇星球、常驻曲伪声波、金句与口令序列号落款等纯函数与子组件。
- 改写 `src/pages/SharePage.tsx`：接入 `useSummaryData`（与 /summary 同一数据源，
  顺带回填 store），占位预览区换成海报；口令 Sheet、报告入口、返回总结按钮不变；
  页面加 `max-w-md` 居中，页头改为终点站 eyebrow。
- `src/index.css`：新增 `share-poster-in` / `share-trail-path`（draw-in）/
  `share-node(-core)`（错峰点亮 + twinkle）/ `share-gravity-ring`（引力波扩散）
  及 reduced-motion 静态归位（dashoffset 归零、节点显形、三圈静态同心环）。

## 浏览器走查（440px 移动宽度 + 桌面宽度）

- 多场（6 场 / 9 场）：星轨 draw-in、节点子主题三色、标签抽样（>8 场取 8 个、
  保留首尾、上下交替）、波形与《倔强》落款、口令序列号均正常。
- 单场：孤勇星球 + 三圈引力波 + 「一颗孤勇星球，自转出独特的引力波」正常。
- 零状态：星空 + 「你的星域还一片寂静」引导正常，落款退化为 MEMORY PRESS。

## 过程中的修正

- 金句 text-xl 在 386px 视口会把「相撞。」挤到第三行：改为
  `whitespace-nowrap + clamp(0.9rem, 4.7vw, 1.2rem)` 自适应字号，窄屏一行放下。
- biome：波形条不能用数组下标当 key（改为预构建 WaveBar 对象用 x 做 key）、
  嵌套三元拆成 `PosterChartArea` 组件、空 aria-hidden 需 `role="presentation"`。

## 未做（维持现状）

- 「保存图片」「分享」按钮仍 disabled，html2canvas 评估仍在后续工作清单。
