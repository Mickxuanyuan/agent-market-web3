import { ApiProperty } from '@nestjs/swagger';
import { BillStatus } from '../../../common/enums';

export class BillDto {
  @ApiProperty({ example: '1', description: '账单 ID' })
  id: string;

  @ApiProperty({ example: '1', description: '关联 Job ID' })
  jobId: string;

  @ApiProperty({ enum: BillStatus, example: BillStatus.locked, description: '账单状态' })
  status: BillStatus;

  @ApiProperty({ example: '5.00', description: '账单金额（平台币）' })
  amount: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', required: false, description: '释放时间（可空）' })
  releasedAt?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '创建时间' })
  createdAt: string;
}
