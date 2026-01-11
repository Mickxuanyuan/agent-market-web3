import { ChainEventsService } from './chain-events.service';

// 构造 insert 链式调用的模拟对象。
function createInsertChain(returningRows: unknown[]) {
  return {
    values: jest.fn().mockReturnValue({
      onConflictDoNothing: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(returningRows),
      }),
    }),
  };
}

describe('ChainEventsService', () => {
  // 提现确认事件写入成功时应更新提现状态。
  it('handleWithdrawConfirmed 插入成功应更新提现', async () => {
    const drizzle = {
      db: {
        insert: jest.fn().mockReturnValue(createInsertChain([{ id: 1n }])),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
        }),
      },
    };

    const service = new ChainEventsService(drizzle as never);
    await (service as any).handleWithdrawConfirmed(
      {
        chainId: 11155111,
        rpcUrl: 'http://localhost',
        contractAddress: '0x0000000000000000000000000000000000000000',
        startBlock: 1n,
        pollIntervalMs: 1000,
      },
      {
        args: { withdrawalId: 1n, txHash: '0xabc' },
        blockNumber: 10n,
        transactionHash: '0xabc',
        logIndex: 1,
      },
    );

    expect(drizzle.db.update).toHaveBeenCalled();
  });

  // 提现确认事件重复写入时不应更新提现状态。
  it('handleWithdrawConfirmed 重复事件应跳过更新', async () => {
    const drizzle = {
      db: {
        insert: jest.fn().mockReturnValue(createInsertChain([])),
        update: jest.fn(),
      },
    };

    const service = new ChainEventsService(drizzle as never);
    await (service as any).handleWithdrawConfirmed(
      {
        chainId: 11155111,
        rpcUrl: 'http://localhost',
        contractAddress: '0x0000000000000000000000000000000000000000',
        startBlock: 1n,
        pollIntervalMs: 1000,
      },
      {
        args: { withdrawalId: 1n, txHash: '0xabc' },
        blockNumber: 10n,
        transactionHash: '0xabc',
        logIndex: 1,
      },
    );

    expect(drizzle.db.update).not.toHaveBeenCalled();
  });
});
