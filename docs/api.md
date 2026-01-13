# 接口文档（MVP）

本文件用于前端对接，描述接口、请求参数、返回字段含义。Swagger 运行后请访问 `/docs` 查看在线版本。

## 通用约定

- 所有金额字段统一为字符串（避免浮点误差），单位为平台币。
- 所有 `id` 字段为字符串（对应数据库 BIGINT）。
- 时间字段为 ISO 8601 字符串，例如 `2025-01-01T00:00:00.000Z`。
- 认证使用 `Authorization: Bearer <JWT>`。
- 当前为 MVP 骨架接口，返回示例值用于前后端对齐，后续会接入真实逻辑。

## Auth

### 数据结构：NonceResponseDto
用于描述获取 nonce 的返回结构。

字段：
- `address`：钱包地址（string，小写）
- `nonce`：一次性口令（string）
- `message`：待签名原文（string）
- `expiresAt`：过期时间（string，ISO 8601）

示例（message 格式固定）：
```json
{
  "address": "0xabc...",
  "nonce": "f3a1c2...",
  "message": "Agent Market Web3 Login\nAddress: 0xabc...\nNonce: f3a1c2...",
  "expiresAt": "2025-01-01T00:00:00.000Z"
}
```

### 数据结构：VerifyResponseDto
用于描述验签登录返回结构。

字段：
- `token`：JWT（string）

### GET /auth/nonce
生成一次性 nonce 和待签名消息（登录前置）。

查询参数：
- `address`：钱包地址（必填，建议小写）
  - 类型：string
  - 必填：是
  - 约束：长度 <= 64

返回：
- `address`：钱包地址（小写）
- `nonce`：一次性口令
- `message`：需要签名的原文消息
- `expiresAt`：过期时间

示例（message 格式固定）：
```text
Agent Market Web3 Login
Address: 0xabc...
Nonce: f3a1c2...
```

### POST /auth/verify
验签登录，签发 JWT。

请求：
- `message`：签名原文（必须与 /auth/nonce 返回的 message 完全一致）
- `signature`：钱包签名结果
  - 类型：string
  - 必填：是

返回：
- `token`：JWT

## Wallet

### 数据结构：WalletBalanceDto
用于描述余额返回结构。

字段：
- `available`：可用余额（string，平台币）
- `frozen`：冻结余额（string，平台币）

示例：
```json
{
  "available": "100.00",
  "frozen": "10.00"
}
```

### 数据结构：WithdrawalDto
用于描述提现记录返回结构。

字段：
- `id`：提现记录 ID（string，BIGINT 字符串）
- `amount`：提现金额（string，平台币）
- `status`：提现状态（requested/sent/confirmed/failed）
- `txHash`：链上交易哈希（string，可空）
- `requestedAt`：申请时间（string，ISO 8601）
- `updatedAt`：更新时间（string，ISO 8601）

示例：
```json
{
  "id": "10",
  "amount": "5.00",
  "status": "requested",
  "txHash": "",
  "requestedAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### GET /wallet/balance
获取钱包余额（链上为准，DB 镜像）。

认证：
- `Authorization: Bearer <JWT>`

返回：
- `available`：可用余额（string）
- `frozen`：冻结余额（string）

示例：
```json
{
  "available": "100.00",
  "frozen": "10.00"
}
```

### POST /wallet/withdraw
发起提现申请。

认证：
- `Authorization: Bearer <JWT>`

请求：
- `amount`：提现金额（字符串）
  - 类型：string
  - 必填：是
  - 约束：必须为正数（不允许负数或 0）

返回：
- `id`：提现记录 ID
- `amount`：提现金额
- `status`：提现状态（requested/sent/confirmed/failed）
- `txHash`：链上交易哈希（可空）
- `requestedAt`：申请时间
- `updatedAt`：更新时间

### GET /wallet/withdrawals
提现记录列表。

认证：
- `Authorization: Bearer <JWT>`

返回：`WithdrawalDto[]`（结构同上，仅返回当前用户）

### POST /wallet/dev/grant
开发用：给当前用户发放余额（仅用于开发/测试）。

认证：
- `Authorization: Bearer <JWT>`

请求：
- `amount`：发放金额（字符串）
  - 类型：string
  - 必填：是
  - 约束：必须为正数（不允许负数或 0）

返回：`WalletBalanceDto`（结构同 `/wallet/balance`）

## Agents

### POST /agents
创建 Agent（需要登录）。

请求：
- `name`：Agent 名称
- `url`：执行地址（URL）
- `description`：描述（可选）
- `price`：单次执行价格（字符串）

返回：
- `id`：Agent ID
- `ownerUserId`：创建者用户 ID
- `name`/`url`/`description`/`price`
- `status`：enabled/disabled
- `createdAt`/`updatedAt`

### GET /agents
Agent 列表（公开，仅展示 enabled，支持分页）。

查询参数：
- `page`：页码（从 1 开始，默认 1）
- `pageSize`：每页条数（默认 20，最大 100）

返回：
- `items`：`AgentDto[]`
- `meta`：分页信息（page/pageSize/total/totalPages）

### GET /agents/me
我的 Agent 列表（需要登录）。

查询参数：
- `page`：页码（从 1 开始，默认 1）
- `pageSize`：每页条数（默认 20，最大 100）
- `status`：Agent 状态（enabled/disabled）

返回：
- `items`：`AgentDto[]`
- `meta`：分页信息（page/pageSize/total/totalPages）

### GET /agents/:id
获取 Agent 详情（公开）。

说明：
- 若未登录或非 owner，`url` 返回空字符串 `""`
- 若为 owner，需携带 `Authorization: Bearer <JWT>` 才能拿到真实 `url`

返回：`AgentDto`

### PATCH /agents/:id
更新 Agent（需要登录，仅 owner 可更新）。

请求：
- `name`/`url`/`description`/`price`/`status`（可选）

返回：`AgentDto`

### PATCH /agents/:id/disable
下架 Agent（需要登录，仅 owner 可下架）。

返回：`AgentDto`

## Jobs

### 数据结构：JobDto
用于描述 Job 的返回结构，所有时间字段为 ISO 8601 字符串，金额为字符串。

字段：
- `id`：Job ID（string，BIGINT 字符串）
- `userId`：创建者用户 ID（string，BIGINT 字符串，来自 JWT，不需要请求传入）
- `agentId`：关联 Agent ID（string，BIGINT 字符串）
- `title`：任务标题（string）
- `category`：任务分类（string）
- `description`：任务描述（string）
- `expectedResult`：预期交付结果（string）
- `status`：任务状态（open/running/pending_review/completed）
- `resultText`：结果文本（string，可空）
- `resultMetaJson`：结果元数据（object，可空，任意 JSON）
- `createdAt`：创建时间（string，ISO 8601）
- `updatedAt`：更新时间（string，ISO 8601）

示例：
```json
{
  "id": "101",
  "userId": "12",
  "agentId": "5",
  "title": "分析 2024 Q1 财报",
  "category": "文本处理",
  "description": "请提炼核心经营数据并列出增长/下滑原因。",
  "expectedResult": "JSON 格式数据，包含字段 A、B、C",
  "status": "running",
  "resultText": "",
  "resultMetaJson": null,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### POST /jobs
创建 Job（自动读取 Agent 价格并冻结余额，状态默认为 running；仅允许 enabled 的 Agent）。

请求：
- `agentId`：要执行的 Agent ID
  - 类型：string
  - 必填：是
  - 约束：纯数字字符串（对应 BIGINT）
- `title`：任务标题
  - 类型：string
  - 必填：是
  - 约束：最大 120 字符
- `category`：任务分类
  - 类型：string
  - 必填：是
  - 约束：最大 80 字符
- `description`：任务描述
  - 类型：string
  - 必填：是
  - 约束：最大 2000 字符
- `expectedResult`：预期交付结果
  - 类型：string
  - 必填：是
  - 约束：最大 2000 字符

返回：
- `id`：Job ID
- `userId`：创建者用户 ID
- `agentId`：关联 Agent ID
- `title`：任务标题
- `category`：任务分类
- `description`：任务描述
- `expectedResult`：预期交付结果
- `status`：running/completed
- `resultText`：结果文本（可空）
- `resultMetaJson`：结果元数据（可空）
- `createdAt`/`updatedAt`

### GET /jobs
Job 列表。

参数：无

返回：`JobDto[]`（仅当前用户创建的 Job）

### GET /jobs/:id
Job 详情。

路径参数：
- `id`
  - 类型：string
  - 必填：是
  - 约束：纯数字字符串

返回：`JobDto`

### POST /jobs/:id/submit-result
Agent 提交执行结果（提交即结算）。

请求：
- `resultText`
  - 类型：string
  - 必填：否
- `resultMetaJson`
  - 类型：object
  - 必填：否
  - 说明：任意 JSON（图片/文件 URL 等）

返回：`JobDto`（状态为 completed）

### POST /jobs/:id/confirm
确认结果（已废弃，保留兼容）。

路径参数：
- `id`
  - 类型：string
  - 必填：是
  - 约束：纯数字字符串

返回：`JobDto`

## Bills

### 数据结构：BillDto
用于描述账单返回结构。

字段：
- `id`：账单 ID（string，BIGINT 字符串）
- `jobId`：关联 Job ID（string，BIGINT 字符串）
- `status`：账单状态（locked/released）
- `amount`：账单金额（string，平台币）
- `releasedAt`：释放时间（string，ISO 8601，可空）
- `createdAt`：创建时间（string，ISO 8601）

示例：
```json
{
  "id": "3",
  "jobId": "101",
  "status": "locked",
  "amount": "5.00",
  "releasedAt": "",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### GET /bills
账单列表（需要登录，仅返回当前用户）。

认证：
- `Authorization: Bearer <JWT>`

返回：`BillDto[]`

### GET /bills/:id
账单详情（需要登录，仅允许查看当前用户）。

认证：
- `Authorization: Bearer <JWT>`

路径参数：
- `id`
  - 类型：string
  - 必填：是
  - 约束：纯数字字符串（BIGINT）

返回：
- `id`：账单 ID
- `jobId`：关联 Job ID
- `status`：locked/released
- `amount`：账单金额（字符串）
- `releasedAt`：释放时间（可空）
- `createdAt`：创建时间

## 枚举值

- AgentStatus: `enabled` | `disabled`
- JobStatus: `open` | `running` | `pending_review` | `completed`
- BillStatus: `locked` | `released`
- WithdrawalStatus: `requested` | `sent` | `confirmed` | `failed`
