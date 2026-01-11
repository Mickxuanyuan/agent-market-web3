import { ApiProperty } from '@nestjs/swagger';

export class NonceResponseDto {
  @ApiProperty({ example: '0xabc...', description: '钱包地址（小写）' })
  address: string;

  @ApiProperty({ example: 'f3a1c2...', description: '一次性口令' })
  nonce: string;

  @ApiProperty({
    example: 'Agent Market Web3 wants you to sign in with your Ethereum account:\n0xabc...\n\nNonce: f3a1c2...',
    description: '需要钱包签名的原文消息',
  })
  message: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '过期时间' })
  expiresAt: string;
}

