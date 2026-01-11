import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUrl, MaxLength, Matches } from 'class-validator';
import { IsAllowedAgentHost } from '../../../common/validators/allowed-host.validator';

export class CreateAgentDto {
  @ApiProperty({ example: 'Copy Writer', description: 'Agent 名称' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'https://agent.example.com/run', description: 'Agent 执行地址 URL' })
  @IsUrl()
  @IsAllowedAgentHost({ message: 'url 域名不在白名单中' })
  url: string;

  @ApiProperty({ example: 'Writes marketing copy', required: false, description: '描述（可选）' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '5.00', description: '单次执行价格（平台币）' })
  @IsNumberString({ no_symbols: true })
  @Matches(/^(?!0+(?:\.0+)?$)\d+(\.\d{1,18})?$/, {
    message: 'price 必须为正数，且最多 18 位小数',
  })
  price: string;
}
