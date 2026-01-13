import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authNonces } from '../../drizzle/schema';

describe('AuthService', () => {
  it('createNonce 地址无效应抛错', async () => {
    const drizzle = { db: { delete: jest.fn(), insert: jest.fn() } };
    const service = new AuthService(drizzle as never, {} as never);

    await expect(service.createNonce('')).rejects.toThrow(BadRequestException);
    expect(drizzle.db.delete).not.toHaveBeenCalled();
  });

  it('createNonce 应返回规范化地址与 message', async () => {
    const drizzle = {
      db: {
        delete: jest.fn(() => ({ where: jest.fn().mockResolvedValue(undefined) })),
        insert: jest.fn((table: unknown) => {
          if (table === authNonces) {
            return { values: jest.fn().mockResolvedValue(undefined) };
          }
          return { values: jest.fn() };
        }),
      },
    };
    const service = new AuthService(drizzle as never, {} as never);

    const result = await service.createNonce(' 0xABC ');

    expect(result.address).toBe('0xabc');
    expect(result.message).toContain('Agent Market Web3 Login');
    expect(result.message).toContain('Address: 0xabc');
    expect(result.message).toContain('Nonce: ');
    expect(drizzle.db.delete).toHaveBeenCalled();
    expect(drizzle.db.insert).toHaveBeenCalledWith(authNonces);
  });
});
