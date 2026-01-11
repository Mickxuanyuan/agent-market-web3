import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyDto {
  @ApiProperty({
    example:
      'Agent Market Web3 wants you to sign in with your Ethereum account:\n0xabc...\n\nNonce: f3a1c2...',
    description: '签名原文（必须和前端签名时一致）',
  })
  @IsString()
  message: string;

  @ApiProperty({ example: '0x...', description: '钱包签名结果' })
  @IsString()
  signature: string;
}

