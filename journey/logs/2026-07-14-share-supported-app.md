# 分享页支持应用入口

- 在 `SharePage` 的场次保存 Sheet 中，按「口令 → 目前支持的应用 → 复制口令」顺序新增五迷百科小程序入口。
- 二维码使用 `src/assets/logo/wmbk-qr.webp`，明确设置原始 300×300 尺寸以避免布局偏移。
- `bunx biome lint src/pages/SharePage.tsx` 与 `git diff --check` 通过；全量 `bun run lint` 有既有错误，`bun run typecheck` 仍被 `SharePoster.tsx` 未使用 `passcode` 参数阻断。
