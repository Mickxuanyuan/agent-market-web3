import { BadRequestException, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { CurrentUser } from '../../common/auth/types';
import { LedgerDirection, LedgerReason } from '../../common/enums';
import { decimalToBigInt } from '../../common/money';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { balances, ledgers } from '../../drizzle/schema';

const ASSET_SYMBOL = 'platform';

@Injectable()
export class WalletService {
  constructor(private readonly drizzle: DrizzleService) {}

  // 获取当前用户余额（available/frozen）。
  // 设计：如果该用户第一次出现，会先初始化 balances 行（0/0），避免上层处理“空行”。
  async getBalance(user: CurrentUser) {
    const now = new Date();

    await this.drizzle.db
      .insert(balances)
      .values({
        userId: user.id,
        available: '0',
        frozen: '0',
        updatedAt: now,
      })
      .onConflictDoNothing({ target: balances.userId });

    const row = await this.drizzle.db
      .select({ available: balances.available, frozen: balances.frozen })
      .from(balances)
      .where(eq(balances.userId, user.id))
      .limit(1);

    return row[0] ?? { available: '0', frozen: '0' };
  }

  // 开发用：直接给当前用户发放余额到 available（相当于“增发”）。
  // - 仅用于开发/测试跑通流程（后续应替换为链上充值/事件同步）
  // - 同时写入 ledgers 作为审计记录（reason=mint）
  async grantDevBalance(user: CurrentUser, amount: string) {
    let amountWei: bigint;
    try {
      amountWei = decimalToBigInt(amount);
    } catch {
      throw new BadRequestException('Invalid amount');
    }
    if (amountWei <= 0n) {
      throw new BadRequestException('Amount must be positive');
    }

    const now = new Date();

    return this.drizzle.db.transaction(async (tx) => {
      // 1) 确保 balances 行存在
      await tx
        .insert(balances)
        .values({
          userId: user.id,
          available: '0',
          frozen: '0',
          updatedAt: now,
        })
        .onConflictDoNothing({ target: balances.userId });

      // 2) 增加 available
      // 使用 sql 模板避免先读再写的竞态（但并发下仍建议后续引入更严格的锁策略）
      await tx
        .update(balances)
        .set({
          available: sql`${balances.available} + ${amount}`,
          updatedAt: now,
        })
        .where(eq(balances.userId, user.id));

      // 3) 写入流水（审计/对账）
      await tx.insert(ledgers).values({
        userId: user.id,
        direction: LedgerDirection.credit,
        asset: ASSET_SYMBOL,
        amount,
        reason: LedgerReason.mint,
        refId: null,
      });

      // 4) 返回最新余额
      const row = await tx
        .select({ available: balances.available, frozen: balances.frozen })
        .from(balances)
        .where(eq(balances.userId, user.id))
        .limit(1);

      return row[0] ?? { available: '0', frozen: '0' };
    });
  }
}
