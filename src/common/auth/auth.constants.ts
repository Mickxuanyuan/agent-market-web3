// 旧方式：MVP 阶段用请求头携带钱包地址来识别用户（不安全，仅开发期）。
export const WALLET_ADDRESS_HEADER = 'x-wallet-address';

// JWT 配置（生产环境请务必设置环境变量）
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

// 认证 nonce 过期时间（秒）
export const NONCE_TTL_SECONDS = Number(process.env.NONCE_TTL_SECONDS ?? '300');
