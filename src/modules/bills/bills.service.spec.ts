import { NotFoundException } from '@nestjs/common';
import { BillsService } from './bills.service';

// 构造 select 链式调用的模拟对象。
function createSelectChain(result: unknown[]) {
  return {
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockResolvedValue(result),
  };
}

describe('BillsService', () => {
  // 列表应返回当前用户账单。
  it('listForUser 应返回列表', async () => {
    const rows = [
      {
        id: 1n,
        jobId: 2n,
        status: 'locked',
        amount: '5.00',
        releasedAt: null,
        createdAt: new Date(),
      },
    ];
    const selectChain = createSelectChain(rows);
    const drizzle = { db: { select: jest.fn().mockReturnValue(selectChain) } };

    const service = new BillsService(drizzle as never);
    const result = await service.listForUser({ id: 1n, walletAddress: '0x1' });

    expect(result).toHaveLength(1);
    expect(drizzle.db.select).toHaveBeenCalled();
  });

  // 详情应在找不到时抛错。
  it('findOneForUser 未找到应抛错', async () => {
    const selectChain = createSelectChain([]);
    const drizzle = { db: { select: jest.fn().mockReturnValue(selectChain) } };

    const service = new BillsService(drizzle as never);
    await expect(
      service.findOneForUser({ id: 1n, walletAddress: '0x1' }, 10n),
    ).rejects.toThrow(NotFoundException);
  });
});
