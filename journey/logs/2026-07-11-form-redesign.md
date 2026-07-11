# 表单页视觉重设计（2026-07-11）

计划见 `journey/plans/2026-07-11-form-redesign.md`。

## 完成内容

- `src/pages/FormPage.tsx`：新增 `FormStepHeader`（eyebrow + Doto 步骤号 + 两段式橙色步骤进度），步骤一改为「旅客登记」文案（PASSENGER /「出发之前，先认识你」/「你从哪里出发？」），步骤二改为「时间坐标」（TIME COORDINATES /「你去过哪几场？」+ 城市/场次总数副标）；城市头部加 Doto 站号（按首演日期即巡演路线排序）、选中数徽标改品牌橙、箭头换成旋转过渡的 `ChevronDown`；场次行加 `--show-color`（场次 themeColor）与 `data-selected`；底栏改为「已选 N 场 · M 座城市」，数字用 Doto + 橙辉光。
- `src/index.css`：`form-step-in` / `form-rows-in` 入场动画（root div 换 `key` 强制重挂载触发）、`.form-show-row` 选中态（左侧色条、复选块 themeColor 填色发光、行背景轻染、子主题标签同色，hover 背景统一收进 CSS 避免与 Tailwind hover 类互相覆盖）、`.form-selected-count` 橙光 Doto；reduced-motion 块补充表单动画停用。
- 数据流、store、路由、gate 行为零改动。

## 验证

- `bun run typecheck` 与 `biome check` 通过（格式由 `--write` 自动整理）。
- Chrome 实测（桌面宽度 + 400px 移动宽度）：两步切换、城市展开、勾选/取消（themeColor 点亮）、橙色徽标与底栏计数、返回按钮均正常。
