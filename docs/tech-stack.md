# 技术栈文档（MVP）

本项目为 MVP 阶段的后端服务，目标是跑通资金与任务闭环。以下为当前技术栈与用途说明。

## 核心框架
- NestJS：后端应用框架，模块化结构，便于扩展与维护。
- TypeScript：类型系统增强，可读性与可靠性更高。

## 数据与持久化
- PostgreSQL：核心业务数据存储。
- Drizzle ORM：类型安全的数据库访问层。
- Drizzle Kit：迁移与 schema 生成工具。

## 认证（MVP）
- 认证流程：`nonce + 签名` 换取 JWT（请求携带 `Authorization: Bearer <token>`）。
- 详情见 `docs/auth-flow.md`。

## Web3 连接（规划）
- viem 或 ethers：链上交互与事件监听（后续接入）。

## 任务与异步（规划）
- BullMQ + Redis：链上事件监听、提现、执行任务队列（后续接入）。

## 接口与文档
- Swagger（@nestjs/swagger）：自动生成 API 文档，地址 `/docs`。
- class-validator + class-transformer：请求参数校验与转换。

## 日志与监控（规划）
- pino：结构化日志输出（后续接入）。
- Sentry：错误上报与监控（后续接入）。

## 部署与运行
- Node.js：运行环境（当前约束 >= 24）。
- pnpm：包管理与依赖安装。

## 目录结构（后端）
- `src/modules`：业务模块（Agent、Job、Bill、Wallet）。
- `src/drizzle`：Drizzle 服务与 schema。
- `drizzle/`：Drizzle Kit 迁移输出目录。
- `docs/`：文档（ERD、数据库、API、技术栈）。
