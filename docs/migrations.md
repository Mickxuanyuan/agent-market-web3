# 数据层与迁移治理

本项目使用 Drizzle ORM + Drizzle Kit 管理 PostgreSQL schema 与迁移。

## 目录说明
- `src/drizzle/schema.ts`：数据表与枚举定义（单一可信源）。
- `drizzle/`：迁移输出目录（由 Drizzle Kit 生成）。

## 基本约定
- 任何表结构变更必须先改 `src/drizzle/schema.ts`，再生成迁移。
- 不手动编辑 `drizzle/` 中的迁移 SQL 文件。
- 迁移文件需按时间顺序提交，避免并发分支冲突。

## 开发流程
1) 修改 `src/drizzle/schema.ts`。
2) 生成迁移：
   ```bash
   pnpm drizzle:generate
   ```
3) 应用迁移到本地数据库：
   ```bash
   pnpm drizzle:push
   ```

## 校验清单
- schema 与迁移结构一致（字段、索引、唯一约束）。
- 新增枚举值仅追加，不删除既有值。
- 迁移 SQL 中未包含破坏性操作（如无备份的 DROP）。

## 常见问题
- 迁移冲突：优先合并 schema 后重新生成迁移，避免手改 SQL。
- 历史迁移缺失：重建本地库并重放迁移，确认差异后修复。
