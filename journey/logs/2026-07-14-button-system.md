# 全站按钮体系「深空控制台」落地

日期：2026-07-14（承接同日 /share 操作区改版；计划见 `journey/plans/2026-07-14-button-system.md`）

## 实施

- `button.tsx` 新增 `starlight` / `glass` 变体，指向 `index.css` 的 `.btn-starlight` / `.btn-glass`；`.share-action-*` 删除（被变体取代），`.share-plan-entry` 保留为 /share 专属签名。
- `.btn-starlight` 颜色经 `color-mix` 从 `var(--starlight, #38bdf8)` 派生，与 /share 已确认稿视觉等值（rgba 0.12/0.42 ≈ transparent 88%/58%）。
- 应用面：/summary 悬浮「生成总结」（+backdrop-blur+px-8）、/share 三操作、/warmup 双 CTA（`[--starlight:#f97316]`）、/form 三个 CTA 与定位切换钮（starlight/glass）、/report 三处补 hover。
- 封面白色圆钮不动（编辑排版首屏锚点）。

## 走查（本地 Chrome 实机）

- /summary 逐卡切到最后一页：悬浮钮星光蓝 + 毛玻璃压在星空回忆卡上，主次清晰。
- /form 两步：继续／下一步为 sky 星光；定位钮 glass（未定位态）。
- /share：与前稿视觉一致（变体替换零回归）；Sheet 复制口令为星光。
- /warmup：临时把 `.dev.vars` 的 `STATS_OPEN_AT` 改到 2027 重启走查（倒计时态 CTA 品牌橙星光，与 Doto 倒计时辉光同频），**已还原配置**。
- /report 渲染正常，hover 类为纯增量。
- `tsc -b` 通过；biome 与基线一致（index.css 6 处历史报错未新增；SharePage format 已顺手修掉）。

## 遗留

- /warmup「开放后」态（进入按钮）未实机截图（同一变体同一色温，风险低）。
- 封面圆钮如需纳入体系，等用户表态。
