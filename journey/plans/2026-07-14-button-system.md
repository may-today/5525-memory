# 全站按钮体系「深空控制台」统一

日期：2026-07-14

## 背景

/share 操作区改版（星光蓝辉光主操作 + 玻璃 hairline 次操作）得到确认后，用户提出：
整个项目的所有按钮都需要优化，特别是 /summary 最后一页悬浮的「生成总结」按钮
（默认 shadcn 白色实心块压在深空回忆卡上，最违和的一处）。

## 方案：把 /share 的两种样式升级为 Button 变体

在 `src/components/ui/button.tsx` 的 cva 中新增两个变体，样式实体放在 `index.css`
（非分层 CSS 稳定覆盖工具类，沿用 `.form-show-row` / `.share-action-*` 先例）：

- **`starlight`**（`.btn-starlight`）：低透明强调色填充 + hairline + 柔和外辉光。
  颜色经 `color-mix` 从 `var(--starlight, #38bdf8)` 派生（填充 12%、边框 42%、
  文字向白混 82%），页面可通过覆写 `--starlight` 整体换色温（warmup 换品牌橙）。
- **`glass`**（`.btn-glass`）：white/10 hairline + white/4 玻璃填充，安静次操作。

`.share-action-primary` / `.share-action-secondary` 删除，由变体取代；
`.share-plan-entry`（特别企划 tri-color 入口）保留，属于 /share 专属签名。

## 逐页应用

| 位置 | 现状 | 处理 |
|---|---|---|
| /summary 最后一页悬浮「生成总结」 | 默认白色实心 | `starlight` + `backdrop-blur` + 加宽 `px-8`（悬浮在滚动内容上需要毛玻璃保证可读性） |
| /share 保存图片 / 将场次保存到 | `.share-action-*` | 换 `starlight` / `glass` 变体（视觉不变） |
| /share Sheet 内「复制口令」 | 默认白色 | `starlight` |
| /warmup 两个 CTA | 默认白色 | `starlight` + 页面覆写 `--starlight: #f97316`（呼应倒计时品牌橙辉光） |
| /form 继续 / 下一步 / 保存 | 作用域 solid sky primary | `starlight`（sky 色温不变，重量从实心变辉光，与全站统一） |
| /form 使用我的定位（选中/未选中） | default / outline 切换 | `starlight` / `glass` 切换（点亮 = 星光） |
| /report 返回圆钮、建议 chips、发送橙圆钮 | 自成一体（数据电台橙） | 保留形态，只补 hover 反馈（原先只有 active:） |
| / 封面白色圆形箭头 CTA | 编辑排版语言的 hero 签名 | **不动**——封面不是深空语境，白色圆钮是首屏视觉锚点 |

保留决策：`.form-page` 的 `--primary: #38bdf8` 覆写继续存在（checkbox 等其他
shadcn 控件仍按页面主题着色）；destructive / link 变体不涉及。

## 验证

本地 `bun run dev` + Chrome 实机走查 /summary 最后一页、/share、/form 两步、
/report、/warmup（临时改 `.dev.vars` 的 `STATS_OPEN_AT` 到未来再还原）；
`tsc -b` + biome 与基线对比不新增报错。
