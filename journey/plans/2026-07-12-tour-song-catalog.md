# 巡演歌曲曲库分类计划

## 目标

在 `getSummaryData` 的单次巡演快照结果中，导出全巡演实际演唱过的去重歌曲列表，并以 `src/data/song-list.ts` 为五月天曲库依据分成「五月天歌曲」与「惊喜歌曲」。

## 实施

1. 为返回数据定义稳定的扁平 `TourSong` 契约：每个条目仅包含 `title` 与 `type`（`mayday` 或 `surprise`）。
2. 从完整歌单快照筛选 `item_type = 'song'`，去除演出装饰并归一化标点／空白后与曲库标题匹配；曲库括号前主标题作为兜底，按曲库／标题稳定排序。
3. 在 `getSummaryData` 返回 `tourSongs`，不新增 D1 查询。
4. 更新设计快照并运行类型与格式检查。
