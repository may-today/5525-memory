# 时长统计卡「时光隧道」重设计

## 背景

「时之穹顶」（沙漏抽象）被反馈与主题偏离。改为「时光隧道」：粒子全屏组成穿越时空隧道的感觉，仍随页面滚动 scrub，粒子最终聚合为总分钟数；数字去掉千位逗号；文案改为更贴合歌词、更有宿命感的版本。

## 视觉设计

### 粒子引擎：`duration-tunnel.ts`（替换 `duration-hourglass.ts`）

星际隧道（starfield tunnel）模型，保持旧引擎的两条硬约束：**粒子位置是平滑进度的纯函数**（倒滚即倒放，无累积状态），以及 City 卡性能先例（DPR ≤ 1.5、sprite 贴图发光、`lighter` 混合、isPaused / destroy）。

- 每粒粒子固定在隧道柱面上：`angle`（环向角）、`radiusScale`（柱面半径抖动）、`depthOffset`（隧道纵深 [0,1) 循环）。
- 透视投影：`z = lerp(Z_FAR, Z_NEAR, fract(depthOffset + travel))`，`scale = FOCAL / z`，屏幕位置 = 消失点 + 环向方向 × 柱面半径 × scale。远处粒子聚在消失点附近（暗），冲向观者时放大、变亮、掠出画面边缘。
- `travel = time·idleDrift·(1−flightEase) + LOOPS·flightEase(progress)`：静止时隧道随时间缓慢漂移（有生命感），滚动接管后由进度驱动飞行 2.4 圈；纯 (progress, time) 函数。
- 消失点带随 travel 的轻微摆动 + 按 (1−z) 加权的「隧道弯曲」偏移，制造航线弧度。
- 飞行速度峰值段每粒子画一帧滞后 ghost（travel 回退量 ∝ easeInOutCubic 导数），形成 warp 拉线感。
- 聚合段（progress 0.5–0.88，错峰窗口 0.34，按数字 x 坐标排序错峰）：投影位置 lerp 到数字点云像素，文字大致从左到右显影；p≥0.93 粒子淡出、DOM 数字淡入交接（复用 handoff 滞回）。
- 数字点云采样逻辑沿用（Doto 700 离屏 fillText + getImageData），文本改为 `String(totalMinutes)`（**无逗号**）。
- 新增 `onIntroChange` 回调（滞回 0.12 / 0.08）：滚动启程后淡出顶部引导语，滚回来再淡入。
- reduced-motion：`renderStaticFrame` 静态画一帧隧道，数字直接可见（组件侧行为不变）。

### 组件与 CSS

- `SummaryCardDuration.tsx`：数字 `String(totalMinutes)`；顶部引导块加 `.summary-duration-intro` 淡出；零状态与收尾句改为时光机意象。
- `index.css`：新增 `.summary-duration-intro` 过渡（reduced-motion 下 transition: none 并保持可见）；注释从「时之穹顶」改为「时光隧道」。弥散光背景保留。

## 文案

- 引导语（滚动前）：「耳机里的少年，已经唱了 25 年。」/「这一趟疯狂世界，你又是何时跳上了这班列车？」/「拉开时光机的舱门，轻轻往下拨动，开启你的 5525 穿梭航线。」
- 数字浮现：「穿过漫长星轨，在 5525 的时空里」/「你与五月天陪伴了」+ 数字 + 分钟；副行「≈ YY 小时 · N 场」保留。
- 零状态：「时光机还停在原地」/「选好你去过的场次，属于你的穿梭航线才会亮起。」
- 列表收尾：「时光机随时待命，这条航线永远可以再飞一遍。」
