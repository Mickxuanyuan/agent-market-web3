import {
  BadRequestException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { balances, users } from '../../drizzle/schema';
import { WALLET_ADDRESS_HEADER } from './auth.constants';
import type { CurrentUser } from './types';

// 规范化钱包地址：去空格并转小写。
function normalizeWalletAddress(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  // 简化处理：统一小写，避免同一地址大小写不同导致“多用户”。
  return trimmed.toLowerCase();
}

@Injectable()
export class WalletAuthGuard implements CanActivate {
  // 注入数据库访问服务。
  constructor(private readonly drizzle: DrizzleService) {}

  // 开发期钱包头鉴权：读取钱包地址并注入 request.user。
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Nest 的 request（Express）对象；我们在下面写入 request.user 供 Controller 使用。
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, unknown>; user?: CurrentUser }>();

    // 1) 从请求头拿到钱包地址（MVP：只要传了就认为是该用户）
    const headerValue = request.headers[WALLET_ADDRESS_HEADER] ?? '';
    if (typeof headerValue !== 'string') {
      throw new UnauthorizedException(
        `Missing header: ${WALLET_ADDRESS_HEADER}`,
      );
    }
    const walletAddress = normalizeWalletAddress(headerValue);
    if (!walletAddress) {
      throw new UnauthorizedException(
        `Missing header: ${WALLET_ADDRESS_HEADER}`,
      );
    }
    // schema.ts: users.walletAddress varchar(64)
    if (walletAddress.length > 64) {
      throw new BadRequestException('Invalid wallet address');
    }

    const now = new Date();

    // 2) findOrCreate users
    // - insert ... onConflictDoNothing：并发下也安全（唯一索引 users_walletAddress_key）
    // - returning：如果插入成功直接拿到 id；否则再 select 一次拿已有记录
    const inserted = await this.drizzle.db
      .insert(users)
      .values({ walletAddress })
      .onConflictDoNothing({ target: users.walletAddress })
      .returning({ id: users.id, walletAddress: users.walletAddress });

    const userRow =
      inserted[0] ??
      (await this.drizzle.db
        .select({ id: users.id, walletAddress: users.walletAddress })
        .from(users)
        .where(eq(users.walletAddress, walletAddress))
        .limit(1))[0];

    if (!userRow) {
      throw new UnauthorizedException('Failed to resolve user');
    }

    // 3) 确保 balances 行存在
    // balances.userId 是 PK，所以用 onConflictDoNothing 只初始化一次即可。
    await this.drizzle.db
      .insert(balances)
      .values({
        userId: userRow.id,
        available: '0',
        frozen: '0',
        updatedAt: now,
      })
      .onConflictDoNothing({ target: balances.userId });

    // 4) 将“用户上下文”挂到 request，后续在 Controller 用 @CurrentUser() 取出
    request.user = { id: userRow.id, walletAddress: userRow.walletAddress };
    return true;
  }
}
