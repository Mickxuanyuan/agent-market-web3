import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '../../../common/enums';
import { IsEnum, IsNumberString, IsOptional, IsString, IsUrl, MaxLength, Matches } from 'class-validator';
import { IsAllowedAgentHost } from '../../../common/validators/allowed-host.validator';

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 'Copy Writer', description: 'Agent 名称' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'https://agent.example.com/run', description: 'Agent 执行地址 URL' })
  @IsOptional()
  @IsUrl()
  @IsAllowedAgentHost({ message: 'url 域名不在白名单中' })
  url?: string;

  @ApiPropertyOptional({ example: 'Writes marketing copy', description: '描述（可选）' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '5.00', description: '单次执行价格（平台币）' })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  @Matches(/^(?!0+(?:\.0+)?$)\d+(\.\d{1,18})?$/, {
    message: 'price 必须为正数，且最多 18 位小数',
  })
  price?: string;

  @ApiPropertyOptional({ enum: AgentStatus, example: AgentStatus.enabled, description: 'Agent 状态' })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;
}
