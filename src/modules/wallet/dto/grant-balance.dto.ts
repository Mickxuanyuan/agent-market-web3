import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

export class GrantBalanceDto {
  @ApiProperty({ example: '100.00', description: '发放金额（平台币）' })
  @IsNumberString()
  amount: string;
}

