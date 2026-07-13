# 专辑解锁进度

## 目标

在 `/summary` 的「岁月音乐墙（岁月留声机）」之后新增一张「专辑解锁进度」统计卡，
按 `src/data/cover.ts` 中的九张五月天正式专辑，展示用户在每张专辑里亲耳听过的曲目占比。

## 数据口径

- 专辑顺序、名称与封面由 `coverIdMap` 提供；它是此页的九张专辑范围。
- 分母是 `songList` 中 `meta.album` 与该专辑名相同的全部曲目，不受本巡演是否演唱影响。
- 分子是这些曲目中，`tourSongs` 同标题曲目任一 `appearance.isHeard` 为 `true` 的首数。
- 曲库外惊喜曲、精选辑、原声带及未标注专辑的曲目均不混入本页。

## 实施

1. 新增 `SummaryCardAlbumProgress`，从既有 `songList` 与 `tourSongs` 在客户端派生九张专辑的数据。
2. 以封面、已听/总首数、百分比进度条与逐曲解锁标签呈现，保留页面内滚动优先级。
3. 在 `SummaryContainer` 将新卡紧接在 `SummaryCardSongWall` 之后，并补充样式、reduced-motion 规则与设计/日志记录。
4. 运行 lint、typecheck 与 diff 检查；尽可能通过本地页面走查确认数据和顺序。
