# 四季歌单卡实现记录

- 新增 `SummaryCardSeasonalPlaylist`：春、夏、秋、冬四宫格，复用现有 `randomSongStats.entries` 填入歌名，并提供无随机曲目时的零状态。
- `SummaryContainer` 已将此卡插入 `SummaryCardRareSongs` 之后。
- 当前仅完成展示骨架；每季最高频随机曲目的日期分组统计尚未接入，避免在没有对应数据口径时给出不实结果。
