import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceDto {
  @ApiProperty({ example: '100.00', description: '可用余额（平台币）' })
  available: string;

  @ApiProperty({ example: '10.00', description: '冻结余额（平台币）' })
  frozen: string;
}
