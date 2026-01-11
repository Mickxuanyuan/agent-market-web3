# Agent Market Web3 后端

面向 Agent 市场的 MVP 后端服务，包含钱包登录、任务流程、账单结算与资金账本。

## 技术栈
- NestJS（API 框架）
- Drizzle ORM + Drizzle Kit（PostgreSQL）
- Swagger（接口文档）
- JWT 鉴权 + 钱包签名验签（viem）

## 环境要求
- Node.js >= 24
- pnpm
- PostgreSQL

## 环境变量
先复制并按需修改 `.env`：

```bash
cp .env.example .env
```

## 安装依赖

```bash
pnpm install
```

## 数据库（Drizzle）
生成迁移（已有迁移可跳过）：

```bash
pnpm drizzle:generate
```

应用迁移到数据库：

```bash
pnpm drizzle:push
```

迁移治理说明见：`docs/migrations.md`。

## 启动服务

```bash
# 开发模式
pnpm start:dev

# 生产构建
pnpm build
pnpm start:prod
```

## 接口文档
Swagger 地址：

```
http://localhost:3000/docs
```

## 常用脚本
- `pnpm lint`
- `pnpm test`
- `pnpm drizzle:generate`
- `pnpm drizzle:push`

## 约定
- 金额使用 `DECIMAL(36,18)` 存储。
- ID 使用 `BIGINT` 存储，接口返回时统一转为字符串。
