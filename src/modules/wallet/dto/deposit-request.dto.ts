import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class DepositRequestDto {
  @ApiProperty({ example: '5.00', description: '充值金额（平台币）' })
  @IsNumberString()
  amount: string;

  @ApiProperty({
    example: '0xabc...',
    required: false,
    description: '链上交易哈希（前端签名交易后回传）',
  })
  @IsOptional()
  @IsString()
  txHash?: string;
}
