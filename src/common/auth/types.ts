export type CurrentUser = {
  // 数据库 users.id（schema.ts 使用 bigint 模式）
  id: bigint;
  // 钱包地址（目前在 guard 中统一转小写并做长度校验）
  walletAddress: string;
};
