# 巡回记录页 /records「全航线日志」

## 需求

- `/share` 分享页新增入口「5525 巡回记录」，点击进入新页面 `/records`。
- `/records` 按时间顺序展示 5525 全部场次：日期时间、城市、标签（dayLabel）、子主题 + versionName、场馆。
- 每场提供「查看歌单」按钮，点击后弹出歌单长图（`shows.playlist_img`）。
- 不做冷冰冰的数据页，要有呼吸感。

## 设计概念：全航线日志

应用叙事里每场演出是「时间航道上的坐标」，`/summary` 只点亮用户自己的坐标；`/records` 是这艘大船自己的完整航行日志——四年、30 座城市、163 个坐标，一条从头走到尾的航线。

- **签名元素「航迹线」**：页面左侧一条贯穿全文的竖向细线，颜色随巡演时代变化——线经过 5525 场次段是粉 `#f472b6`、5525+1 段是蓝 `#38bdf8`、5525+2 段是橙 `#fb923c`（与 `/form`、Overview、SharePoster 同一套子主题色）。线本身就把「三个时代」的结构信息画出来了，站点节点在线上发光。
- **驻站分组**：163 场不平铺。连续且 `city + venue + subTheme + versionName` 相同的场次聚成一个「驻站」（约 40 个），站头是大号 font-title 城市名 + Doto 站序号 + 场馆 + 子主题·版本 chip（时代色）；站内每行一场：Doto 日期 + 星期 + dayLabel + 开演时间（有记录时）+ 查看歌单。
- **年份呼吸位**：跨年处插入超大 Doto 幽灵年份数字（低透明度），给长列表以段落和留白——呼吸感主要来自年份分隔 + 驻站间距，不靠卡片盒子。
- **克制**：行内容全部安静的 zinc 文本；颜色只出现在航迹线、节点、chip 三处。

## 歌单长图弹层

- 全屏 fixed 覆盖层：暗背景 + 顶部信息条（城市 · dayLabel · 日期 + 关闭按钮）+ 纵向滚动的长图区（`overscroll-contain`）。
- 图床是微博（sinaimg.cn）有 Referer 防盗链：`<img referrerPolicy="no-referrer">`；加载中显示 pulse 文案，加载失败提示 + `rel="noreferrer"` 的原图链接兜底。
- 打开时锁 body 滚动；Esc / 点背景 / 关闭按钮均可关闭。
- `playlist_img` 为空的场次（本地数据约 17/163）：按钮位置显示灰字「歌单暂缺」。

## 技术方案

1. `src/routes/records.tsx`：`beforeLoad: ensureStatsOpen()`（与 /share、/data-station 同门禁），`loader` 调既有 `getAllShows()`，无新增 server function。
2. `src/pages/records/RecordsPage.tsx`：页头（返回 /share 的圆形按钮，复用 ReportPage 形态）+ eyebrow `TOUR ARCHIVE · 全航线日志` + 标题 + 总览句（Doto 数字）；分组渲染。
3. `src/pages/records/SetlistImageOverlay.tsx`：歌单长图弹层。
4. `src/pages/SharePage.tsx`：在「你的专属报告」入口下方加「5525 巡回记录」入口——同 eyebrow+标题+右箭头版式，但用安静的 white/10 hairline 边框（渐变边框保持数据电台特别企划的专属性）。
5. `index.css`：`.records-*` 样式（航迹线、节点、年份幽灵数字、进场动画）；滚动进场用 IntersectionObserver 一次性加类，`prefers-reduced-motion` 全部停用。
6. 更新 `journey/design.md` 新增 /records 章节与 /share 入口说明。

## 口径

- 排序 `show_date ASC, id ASC`（getAllShows 已保证）。
- 「日期时间」= showDate（MM/DD + 星期）+ showStartTime（有真实记录才显示，缺失不显示不兜底）。
- 展示全部场次，不做「你在场」个人化标记（保持档案属性，避免与 /summary 职责重叠）。
