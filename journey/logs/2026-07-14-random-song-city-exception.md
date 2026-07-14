# 随机曲目台中特例 — 实施日志

- 新增 `randomSongSpecialBlackList`：`subTheme = "5525"` 且 `city = "台中"` 时，过滤〈如果我们不曾相遇〉。
- 汇总统计与报告页的 request／encore 随机曲目排行共用这一规则；报告页的 request 范围也同步排除点歌固定曲黑名单。
