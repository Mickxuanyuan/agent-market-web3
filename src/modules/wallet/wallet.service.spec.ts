import { BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { balances, ledgers, withdrawals } from '../../drizzle/schema';

// 构造事务内的数据库调用模拟。
function createTxMocks(options: {
  available: string;
  updated?: boolean;
}) {
  const tx = {
    insert: jest.fn((table: unknown) => {
      if (table === balances) {
        return {
          values: jest.fn().mockReturnValue({
            onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
          }),
        };
      }
      if (table === withdrawals) {
        return {
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 1n,
                type: 'withdraw',
                amount: '5.00',
                status: 'requested',
                txHash: null,
                requestedAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        };
      }
      if (table === ledgers) {
        return {
          values: jest.fn().mockResolvedValue(undefined),
        };
      }
      return { values: jest.fn() };
    }),
    select: jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ available: options.available }]),
    })),
    update: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest
        .fn()
        .mockResolvedValue(options.updated === false ? [] : [{ userId: 1n }]),
    })),
  };

  return tx;
}

describe('WalletService', () => {
  // 金额非法应直接拒绝。
  it('requestWithdraw 金额非法应抛错', async () => {
    const drizzle = { db: { transaction: jest.fn() } };
    const service = new WalletService(drizzle as never);

    await expect(
      service.requestWithdraw({ id: 1n, walletAddress: '0x1' }, 'abc'),
    ).rejects.toThrow(BadRequestException);
  });

  // 余额不足应拒绝提现。
  it('requestWithdraw 余额不足应抛错', async () => {
    const tx = createTxMocks({ available: '1.00' });
    const drizzle = {
      db: {
        transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(tx)),
      },
    };
    const service = new WalletService(drizzle as never);

    await expect(
      service.requestWithdraw({ id: 1n, walletAddress: '0x1' }, '5.00'),
    ).rejects.toThrow(BadRequestException);
  });

  // 成功提现应返回记录。
  it('requestWithdraw 成功应返回记录', async () => {
    const tx = createTxMocks({ available: '10.00' });
    const drizzle = {
      db: {
        transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(tx)),
      },
    };
    const service = new WalletService(drizzle as never);

    const result = await service.requestWithdraw(
      { id: 1n, walletAddress: '0x1' },
      '5.00',
    );

    expect(result.id).toBe('1');
    expect(result.amount).toBe('5.00');
  });
});
