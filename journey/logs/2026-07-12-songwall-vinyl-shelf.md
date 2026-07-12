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

## 后续迭代（同日）：脊线比例修正 + 共振频率 VU 表盘

1. **脊线比例**：反馈唱片「太厚/太矮」不像真黑胶，由 23×88px 调成 17×96px（行高 112→120px，架板渐变断点同步 110/111/114/118/120），惊喜架 `w-[23px]`→`w-[17px]`，图例色样同步细长化。
2. **共振频率 VU 表盘**（`ResonanceMeter` + `summary-vu-*`）：引导语下新增功放面板——复用 `summary-shelf-frame` 木纹外框，内为琥珀背光 SVG 表盘（radialGradient 底部暖橙 + 玻璃下暖光池，呼应「真空管暖光」意象）。刻度 0–100（80 起红区），指针角度 = 进度映射 `-50deg..50deg`；`summary-vu-swing` 关键帧里用 `calc(var(--vu-angle) ± n deg)` 实现甩出→过冲→回摆→定格，`transform-box: view-box` + `transform-origin` 定枢轴；百分比读数（表盘中央，dot-matrix 数字字体天然贴合复古仪表）在指针收摆期间淡入。reduced-motion 下指针/读数静态直出。文案：「你与五月天的音乐共振频率」。
3. 走查：本地 dev + Chrome，0% 真实态 + JS 注入 42% 验证指针定格与读数；typecheck / biome lint 通过。

## 后续迭代（同日）：共振频率口径调整

- 用户要求把「音乐共振频率」从“整面墙里你听过多少张”改为更聚焦五月天主曲库本身：**五月天曲库中用户听过的首数 / 五月天曲库中本巡演实际唱过的首数**。
- `SummaryCardSongWall.tsx` 现改为只用 `sungShelf` 作为分母、`sungShelf` 中 `state === 'heard'` 的首数作为分子；曲库外 surprise shelf 继续展示，但不再计入 VU 百分比。
- 卡面引导语同步改成「五月天曲库里实际唱过的 X 首里，你亲耳听过的 Y 首」，避免文案仍暗示曲库外歌曲被纳入口径。
