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

返回：`WithdrawalDto[]`（结构同上，仅返回当前用户）

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
获取 Agent 详情（需要登录，仅限 owner）。

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

### POST /jobs
创建 Job（自动读取 Agent 价格并冻结余额，状态默认为 running；仅允许 enabled 的 Agent）。

请求：
- `agentId`：要执行的 Agent ID

返回：
- `id`：Job ID
- `userId`：创建者用户 ID
- `agentId`：关联 Agent ID
- `status`：running/completed
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
Agent 提交执行结果（提交即结算）。

请求：
- `resultText`：结果文本（可选）
- `resultMetaJson`：结果元数据（可选，图片/文件 URL）

返回：`JobDto`（状态为 completed）

### POST /jobs/:id/confirm
确认结果（已废弃，保留兼容）。

返回：`JobDto`

## Bills

### GET /bills
账单列表（需要登录，仅返回当前用户）。

返回：`BillDto[]`

### GET /bills/:id
账单详情（需要登录，仅允许查看当前用户）。

返回：
- `id`：账单 ID
- `jobId`：关联 Job ID
- `status`：locked/released
- `amount`：账单金额（字符串）
- `releasedAt`：释放时间（可空）
- `createdAt`：创建时间
