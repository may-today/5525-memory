# 音乐墙重构为「岁月留声机」唱片架 · 过程记录

计划见 `journey/plans/2026-07-12-songwall-vinyl-shelf.md`。

## 实现

- `SummaryCardSongWall.tsx` 重写：数据推导保留（songList × tourSongs Map 连接），渲染改为上层多行唱片架（唱过的在前、全巡演未唱的灰暗唱片排架尾）+ 下层单行金色惊喜架（复用 `summary-space-scroller` 横滚）。抽出动画的错峰索引跨两个架子连续，形成一道波。
- `index.css`：删除 `.summary-wall-tile-*`，新增 `.summary-shelf-*`（木框、架板 repeating-gradient、脊线三态 + 金色变体、抽出动画、reduced-motion 停用）。

## 踩坑

1. **竖排文字折行假象**：脊线 title span 最初是 inline，`white-space/overflow/text-overflow` 不生效导致真折行，加 `display: block` 修复。但修复后截图里「折行」依旧——反复用 Range/getBoundingClientRect 验证 DOM 是单列后才发现：**那是相邻两张点亮唱片的辉光融成了一块「宽唱片」**，两列文字其实是两首歌。最终靠列距 2px→3px + 点亮脊线左右 inset 明暗缘 + 辉光半径 14px→10px 解决。教训：视觉排查时先确认「一块」到底是几个元素。
2. 点亮脊线顶部渐变最初太浅（color-mix 18% 暗色），白字对比度不足，加深到 34%/58%/72%。

## 走查

本地 dev + Chrome（14 场跨全巡演样本，localStorage 直写 `concert-form-data:v1`）：三种状态着色与排序、金色架抽出/沉底、横滚、桌面与 430px 移动宽度均正常；typecheck / biome lint 通过。
