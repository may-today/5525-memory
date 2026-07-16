# 表单场次全选

- 在 `/form` 第二步底栏的「清空」左侧加入「全选」按钮。
- 全选复用 `replaceSelectedShows(allShows)`，一次性选中当前可见目录并清除旧匿名报告状态；全部场次已选时按钮禁用。
- 「全选」与「清空」统一使用 shadcn `Button` 的 `ghost` / `xs` 组合。
