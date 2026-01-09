import { ApiProperty } from '@nestjs/swagger';
import { WithdrawalStatus } from '../../../common/enums';

export class WithdrawalDto {
  @ApiProperty({ example: '1', description: '提现记录 ID' })
  id: string;

  @ApiProperty({ example: '5.00', description: '提现金额（平台币）' })
  amount: string;

  @ApiProperty({ enum: WithdrawalStatus, example: WithdrawalStatus.requested, description: '提现状态' })
  status: WithdrawalStatus;

  @ApiProperty({ example: '0xabc...', required: false, description: '链上交易哈希（可空）' })
  txHash?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '申请时间' })
  requestedAt: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '更新时间' })
  updatedAt: string;
}
