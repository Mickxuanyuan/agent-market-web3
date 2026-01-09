# 接口文档（MVP）

本文件用于前端对接，描述接口、请求参数、返回字段含义。Swagger 运行后请访问 `/docs` 查看在线版本。

## 通用约定

- 所有金额字段统一为字符串（避免浮点误差），单位为平台币。
- 所有 `id` 字段为字符串（对应数据库 BIGINT）。
- 时间字段为 ISO 8601 字符串，例如 `2025-01-01T00:00:00.000Z`。
- 当前为 MVP 骨架接口，返回示例值用于前后端对齐，后续会接入真实逻辑。

## Wallet

### GET /wallet/balance
获取钱包余额（链上为准，DB 镜像）。

返回：
- `available`：可用余额（字符串）
- `frozen`：冻结余额（字符串）

示例：
```json
{
  "available": "100.00",
  "frozen": "10.00"
}
```

### POST /wallet/withdraw
发起提现申请。

请求：
- `amount`：提现金额（字符串）

返回：
- `id`：提现记录 ID
- `amount`：提现金额
- `status`：提现状态（requested/sent/confirmed/failed）
- `txHash`：链上交易哈希（可空）
- `requestedAt`：申请时间
- `updatedAt`：更新时间

### GET /wallet/withdrawals
提现记录列表。

返回：`WithdrawalDto[]`（结构同上）

## Agents

### POST /agents
创建 Agent。

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
Agent 列表。

返回：`AgentDto[]`

### GET /agents/:id
获取 Agent 详情。

返回：`AgentDto`

### PATCH /agents/:id
更新 Agent。

请求：
- `name`/`url`/`description`/`price`/`status`（可选）

返回：`AgentDto`

## Jobs

### POST /jobs
创建 Job（自动读取 Agent 价格并冻结余额）。

请求：
- `agentId`：要执行的 Agent ID

返回：
- `id`：Job ID
- `userId`：创建者用户 ID
- `agentId`：关联 Agent ID
- `status`：open/running/pending_review/completed
- `resultText`：结果文本（可空）
- `resultMetaJson`：结果元数据（可空）
- `createdAt`/`updatedAt`

### GET /jobs
Job 列表。

返回：`JobDto[]`

### GET /jobs/:id
Job 详情。

返回：`JobDto`

### POST /jobs/:id/submit-result
Agent 提交执行结果（仅一次）。

请求：
- `resultText`：结果文本（可选）
- `resultMetaJson`：结果元数据（可选，图片/文件 URL）

返回：`JobDto`（状态应为 pending_review）

### POST /jobs/:id/confirm
用户确认结果，触发结算。

返回：`JobDto`（状态应为 completed）

## Bills

### GET /bills
账单列表。

返回：`BillDto[]`

### GET /bills/:id
账单详情。

返回：
- `id`：账单 ID
- `jobId`：关联 Job ID
- `status`：locked/released
- `amount`：账单金额（字符串）
- `releasedAt`：释放时间（可空）
- `createdAt`：创建时间
