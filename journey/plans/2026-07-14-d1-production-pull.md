# 生产 D1 完整拉取到本地

## 目标

提供一个显式确认的 `bun run db:pull` 命令，将生产 `5525-memory-db` 的完整快照覆盖到本地 Miniflare D1；本地所有未同步的数据均视为可丢弃。

## 实施步骤

1. 确认 Wrangler 的 export 内容是否包含 migration 元数据，并确定可重复执行的本地重建顺序。
2. 新增受 `set -euo pipefail` 保护的脚本：先导出远程快照至临时文件，再删除本地 D1 持久化目录并导入快照；需要明确确认参数才能实际执行。
3. 在 `package.json` 暴露 `db:pull`，并在 README 中说明它会覆盖本地所有 D1 表、需要 Cloudflare 凭证、以及本地开发服务器必须先停止。
4. 通过本地导出/导入副本验证脚本顺序，并运行静态检查和 diff 检查。

## 结果

- Wrangler 本地完整导出已确认包含 `d1_migrations` 的 schema 与数据，因此远程完整导出的导入结果会保留正确的 migration 记录。
- 已新增 `db:pull` 的显式确认门槛及导入失败时的本地状态恢复；`bash -n`、无确认参数保护检查与 `git diff --check` 均通过。未执行真实生产拉取，避免在未被要求时改动当前本地 D1 状态。
