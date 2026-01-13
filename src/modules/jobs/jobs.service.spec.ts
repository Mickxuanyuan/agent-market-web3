import { JobsService } from './jobs.service';

// 构造 select 链式调用的模拟对象。
function createSelectChain(result: unknown[]) {
  return {
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
  };
}

describe('JobsService', () => {
  // 已完成任务提交结果应直接返回，不触发结算事务。
  it('submitResult 完成态应幂等返回', async () => {
    const row = {
      jobId: 1n,
      jobStatus: 'completed',
      jobResultText: 'ok',
      jobResultMetaJson: null,
      jobCreatedAt: new Date(),
      jobUpdatedAt: new Date(),
      jobUserId: 2n,
      jobAgentId: 3n,
      jobTitle: 'Title',
      jobCategory: 'Category',
      jobDescription: 'Desc',
      jobExpectedResult: 'Expect',
      agentOwnerUserId: 5n,
    };

    const selectChain = createSelectChain([row]);
    const drizzle = {
      db: {
        select: jest.fn().mockReturnValue(selectChain),
        transaction: jest.fn(),
      },
    };

    const service = new JobsService(drizzle as never);
    const result = await service.submitResult(
      { id: 5n, walletAddress: '0x1' },
      1n,
      { resultText: 'ok', resultMetaJson: null },
    );

    expect(result.status).toBe('completed');
    expect(drizzle.db.transaction).not.toHaveBeenCalled();
  });
});
