# 四季歌单卡：四宫格骨架

## 目标

在「最小众歌单」之后新增「你的四季歌单」统计页，先建立四季标签与四宫格歌名布局，作为后续按季节计算随机曲目最高频歌曲的展示容器。

## 范围

1. 新建 `SummaryCardSeasonalPlaylist`，以春、夏、秋、冬四格展示现有随机曲目统计中的歌名。
2. 将卡片插入 `SummaryContainer` 的 `SummaryCardRareSongs` 之后。
3. 在 `journey/design.md` 记录当前为视觉骨架，季节统计尚未接入。

## 验证

运行 TypeScript 检查、针对改动文件的 lint，以及差异空白检查。
