# 5525 Memory

一个以移动端为先、回顾五月天 #5525 巡回演唱会的网页应用，使用 TanStack Start 构建并部署在 Cloudflare Workers。

## 场次保存口令

分享页会把用户已选择的场次转成一个短口令；它不含昵称、位置或任何其他个人资料。其他程序可直接还原出按日期排列的场次序号。

### 场次序号

口令记录的是所有可见场次按 `show_date ASC, id ASC` 排列后的零基 `showIndex`（即第 `x + 1` 场）。这个序号会在用户选场时随选择一同保存，因此分享页无需再次下载完整目录。第三方可直接把还原出的序号映射到自己的按日期场次清单。

### 格式：`5525-` + 模式 + Base64URL

这不是加密；口令只对由小到大排序、去重后的零基 `showIndex` 做可逆编码与压缩。`5525-` 后的第一个字符是模式，剩余部分为不带 `=` 填充的 Base64URL（RFC 4648 §5）。生成方会比较两种模式的长度并取更短者。

| 模式 | 数据 | 适用场景 |
| --- | --- | --- |
| `s` | 相邻 index 的正差值，以 unsigned LEB128 写入 | 只选择少量、分散场次 |
| `b` | 从 index 0 起每场占 1 bit，最低位对应较小 index | 选择很多场次 |

例如 `[0, 4, 12]`（第 1、5、13 场）以位图模式编码为 `5525-bERA`。空选择使用 `5525-s`。

### 解码步骤（伪代码）

```text
decode(token):
  if token does not start with "5525-": reject
  mode = first character after "5525-"
  bytes = Base64URLDecodeWithoutPadding(the remaining characters)
  if mode == "s":
    read unsigned LEB128 values until EOF as positive deltas; cumulative sum starts at -1
  if mode == "b":
    return every set bit's zero-based position, from low bit to high bit
  otherwise: reject
```

实现应拒绝非法 Base64URL、截断或非规范的 LEB128、零差值及未知模式。接入方可在解码后自行检查这些序号是否存在于自己的资料库。

## 本地开发

```bash
bun install
bunx wrangler d1 migrations apply 5525-memory-db --local
bun run dev
```

`d1 migrations apply --local` 会在 `.wrangler/state/v3/d1` 下初始化本地 D1 数据库（该目录已被 Git 忽略，且每台机器各自独立）。它由 Miniflare 完整模拟，本地开发不需要 Cloudflare 帐号或凭证。

## 数据库（Cloudflare D1）

巡演、场次与歌单数据存放在 Cloudflare D1，而非静态 JSON 文件。数据访问层见 `src/server/`，完整设计见 `journey/plans/2026-07-08-d1-data-migration.md`。

**Schema 与初始数据的变更只能追加。** 已应用过的 migration 文件绝不能修改。如需变更 Schema 或初始数据，请新建一个 migration：

```bash
bunx wrangler d1 migrations create 5525-memory-db <name>
```

随后按上述方式在本地应用。任何人拉取了涉及 `migrations/` 的新提交后，只需重新运行 `wrangler d1 migrations apply 5525-memory-db --local`；它只会应用尚未执行过的 migration。

**将 Schema 变更部署到生产环境**目前仍需手动进行：由拥有 Cloudflare 帐号权限的成员运行：

```bash
bunx wrangler d1 migrations apply 5525-memory-db --remote
bun run deploy
```

### 用生产快照覆盖本地 D1

若本地所有 D1 数据都可以丢弃，可先停止本地开发服务器，再执行：

```bash
bun run db:pull -- --confirm
```

该命令会先从生产 `5525-memory-db` 导出完整快照（包括 schema、所有表及 migration 记录），再以该快照重建 `.wrangler/state/v3/d1`。本地数据库会完全以生产数据为准，无法恢复原有本地改动；若导入失败，脚本会还原原本的本地状态。命令需要已登录且有该 D1 数据库读取权限的 Cloudflare 帐号。

## 检查

```bash
bun run lint
bun run typecheck
bun run build
```

## Cloudflare Workers

修改 `wrangler.jsonc` 后，请生成 Worker binding 类型：

```bash
bun run cf-typegen
```

在本地预览生产 Worker，或直接部署：

```bash
bun run preview
bun run deploy
```

## 添加组件

如需为应用添加组件，请运行：

```bash
npx shadcn@latest add button
```

该命令会将 UI 组件放入 `src/components` 目录。

## 使用组件

在应用中使用组件时，按以下方式导入：

```tsx
import { Button } from "@/components/ui/button"
```
