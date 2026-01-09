import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

export class WithdrawRequestDto {
  @ApiProperty({ example: '5.00', description: '提现金额（平台币）' })
  @IsNumberString()
  amount: string;
}
