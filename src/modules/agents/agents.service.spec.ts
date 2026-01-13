import { BadRequestException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { agents } from '../../drizzle/schema';

function createSelectChain(result: unknown[]) {
  return {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
  };
}

describe('AgentsService', () => {
  it('create 应写入规范化后的 name 与 url', async () => {
    const selectChain = createSelectChain([]);
    const insertValues = jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([
        {
          id: 1n,
          ownerUserId: 1n,
          name: 'Agent One',
          url: 'https://agent.example.com/run',
          description: null,
          price: '5.00',
          status: 'enabled',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    });
    const drizzle = {
      db: {
        select: jest.fn().mockReturnValue(selectChain),
        insert: jest.fn((table: unknown) => {
          if (table === agents) {
            return { values: insertValues };
          }
          return { values: jest.fn() };
        }),
      },
    };

    const service = new AgentsService(drizzle as never);
    await service.create(
      { id: 1n, walletAddress: '0x1' },
      {
        name: '  Agent One  ',
        url: ' https://agent.example.com/run ',
        description: undefined,
        price: '5.00',
      },
    );

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Agent One',
        url: 'https://agent.example.com/run',
      }),
    );
  });

  it('create 名称重复应抛错', async () => {
    const selectChain = createSelectChain([{ id: 1n }]);
    const drizzle = {
      db: {
        select: jest.fn().mockReturnValue(selectChain),
      },
    };

    const service = new AgentsService(drizzle as never);
    await expect(
      service.create(
        { id: 1n, walletAddress: '0x1' },
        {
          name: 'Agent One',
          url: 'https://agent.example.com/run',
          description: undefined,
          price: '5.00',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
