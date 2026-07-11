# 巡演时间轴页重设计（2026-07-12）

## 完成

按用户反馈（数据死板、文案缺失、两段点亮差别不明显）重做 `SummaryCardOverview`：

1. **子主题着色**：新增 `SUB_THEME_COLORS`（粉/蓝/橙，与 `/form` 一致）+ `dateColorMap`，
   第一段点亮改为子主题色（`fill-opacity 0.62`，彩色背景星图）。
2. **你去过一眼可辨**：第二段在同色上 `scale(1.4)`（`transform-box: fill-box`）+ 满不透明
   + `.overview-dot-lit` 呼吸辉光（`--dot-color` 传色的 `drop-shadow` pulse）。
3. **文案**：eyebrow + 引导语（「留下了 {163} 个坐标」「其中 {你去过} 个……最亮的光点」，
   数字 Doto，「你去过」实时随点亮递增）+ 图例 + 收尾句 + 零状态引导。
4. `index.css` 新增 `.overview-count(-lit)` / `.overview-dot-lit` / `@keyframes overview-dot-pulse`，
   reduced-motion 停用呼吸保留静态辉光。

## 验证

- typecheck / lint 干净（唯一报错为 `FormPage.tsx` 预存问题：上一 commit `a938cf8` 注释掉站号
  span 后 `groupIndex` 变为未使用，与本次无关，未改）。
- 浏览器走查（seed 12 场跨三子主题）：彩色星图、选中点放大呼吸清晰可辨、引导语数字递增到 12
  与收尾一致、零状态文案正确；DOM 校验 2025/74 + 2026/27 格全部着色（全页 JPEG 会把 0.62 暗点
  压得不明显，zoom 后清晰）。

## 待办

- 站在真机高分屏上复核 0.62 背景星图亮度是否需要微调（桌面截图偏暗，retina 会更清晰）。
