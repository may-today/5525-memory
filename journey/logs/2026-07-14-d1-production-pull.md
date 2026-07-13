# 生产 D1 完整拉取到本地

## 2026-07-14

- 已确认需求：使用者允许丢弃本地 D1 的全部数据，以线上 D1 为唯一来源重建本地数据库。
- 已用本地完整导出验证：SQL 含 `d1_migrations` 的 schema 与记录，完整重建不会遗失 migration 状态。
- 新增 `scripts/pull-production-d1.sh` 与 `bun run db:pull -- --confirm`；脚本先成功导出线上快照，再将旧的本地状态暂存，导入失败时恢复，成功后才丢弃。README 和设计快照已记录破坏性范围、停止 dev server 的前置条件与 Cloudflare 权限要求。
