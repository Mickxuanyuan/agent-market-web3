# 链上事件同步（学习版说明）

本文件用于解释“链上事件同步”的目的、思路与实现方式，帮助你理解为何需要它以及怎么落地。

## 1. 为什么需要同步链上事件
在 Web3 业务中，链上交易是最终可信来源（source of truth）。后端数据库只是“镜像”，用于快速查询、展示与风控。常见问题：

- **提现状态不准确**：链上交易可能失败或迟迟未确认，数据库里如果不跟进会显示错误状态。
- **充值不到账**：用户把钱转进合约/钱包后，只有链上事件能证明到账。
- **重复记账**：同一事件可能被重复推送或重复拉取，若无去重会重复入账。

因此必须有一套机制把链上事件同步到数据库，并做到 **幂等、可追溯、可恢复**。

## 2. 需要同步哪些事件
按业务优先级常见两类：

1) **提现事件**（提现状态）
- 事件来源：链上转账成功/失败/回滚
- 对应数据库：更新 `withdrawals.status` 为 `confirmed` 或 `failed`

2) **充值事件**（余额镜像）
- 事件来源：用户向合约/钱包转账
- 对应数据库：增加 `balances.available`，写入 `ledgers`（reason=deposit）

可选扩展：
- 交易手续费/手续费补贴
- 任务相关链上结算事件

## 3. 数据库如何存链上事件
本项目已有表：`chain_events`（已在 Drizzle schema 中定义），用于做“事件幂等与审计”。

建议字段：
- `chainId`：链 ID
- `txHash`：交易哈希
- `logIndex`：日志序号（同一交易内唯一）
- `eventType`：事件类型（字符串）
- `payloadJson`：原始事件数据
- `blockNumber`：区块高度
- `createdAt`

**幂等关键**：`chainId + txHash + logIndex` 作为唯一键，重复写入会失败（或忽略）。

## 4. 同步方式有哪几种

### 方式 A：后台主动监听/拉取（推荐）
- 服务运行时订阅链上事件（WebSocket）或定时拉取（HTTP）。
- 拿到事件后写入 `chain_events`，再执行业务更新。

优点：
- 无需依赖外部服务
- 状态实时性高（订阅）

缺点：
- 需要运行稳定的长连接/定时任务
- 维护成本更高

### 方式 B：外部服务推送事件
- 区块链监听服务（自建或第三方）推送事件到你提供的 API（如 `POST /chain-events`）

优点：
- 应用层更轻量
- 运维更简单

缺点：
- 依赖外部系统稳定性
- 需要校验来源防伪造

## 5. 事件处理的通用流程
无论哪种方式，处理流程应一致：

1) **写入 chain_events（幂等）**
- 如果已存在则直接返回（避免重复处理）

2) **解析事件类型**
- 根据 `eventType` 或 topic 判断是提现/充值等

3) **更新业务数据（事务内）**
- 提现：更新 `withdrawals.status` + `updatedAt`
- 充值：更新 `balances.available` + 写 `ledgers`

4) **记录处理结果**
- 可在 `payloadJson` 内记录处理结果或写业务日志

## 6. 幂等与一致性注意事项

- **同一事件只处理一次**：由 `chain_events` 唯一键保证。
- **状态只允许单向流转**：例如提现 `requested -> sent -> confirmed/failed`，不要回退。
- **事务保证一致性**：写 `chain_events` 与更新业务状态尽量在同一个事务中处理。

## 7. 实施建议（分阶段）

### 第一步：只做提现状态
- 先支持事件更新 `withdrawals.status`
- 风险低，业务收益高

### 第二步：做充值入账
- 处理转入事件，写入 `balances` 与 `ledgers`

### 第三步：完善监控与补偿
- 定时扫描“链上已确认但数据库未更新”的交易
- 提供补偿脚本

## 8. 与当前项目的对应关系

- `chain_events` 表：已存在
- `withdrawals` 表：已存在
- `balances` / `ledgers` 表：已存在

接入点可选：
- 新增 `ChainEventsModule` + `ChainEventsService` + `ChainEventsController`
- 或在后台 Job 中处理事件（无 controller）

## 9. 当前项目的落地方案（已实现）
本项目已先落地“后台轮询 + 提现状态同步”，你只需要补齐配置与合约 ABI 即可运行。

### 已实现范围
- 后台定时轮询链上日志（HTTP RPC）。
- 处理 `WithdrawConfirmed` 与 `WithdrawFailed` 两类事件。
- 幂等写入 `chain_events`，并更新 `withdrawals.status`。

### 需要你补齐的配置
- `RPC_URL`：链上 RPC 地址
- `CONTRACT_ADDRESS`：合约地址
- `START_BLOCK`：合约部署块或当前块
- `CHAIN_ID`：链 ID（默认示例为 Sepolia）

### ABI 事件格式（可按合约调整）
```text
event WithdrawConfirmed(uint256 withdrawalId, bytes32 txHash)
event WithdrawFailed(uint256 withdrawalId, string reason)
```
