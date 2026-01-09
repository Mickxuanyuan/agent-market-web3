import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '../../../common/enums';
import { IsEnum, IsNumberString, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 'Copy Writer', description: 'Agent 名称' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'https://agent.example.com/run', description: 'Agent 执行地址 URL' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: 'Writes marketing copy', description: '描述（可选）' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '5.00', description: '单次执行价格（平台币）' })
  @IsOptional()
  @IsNumberString()
  price?: string;

  @ApiPropertyOptional({ enum: AgentStatus, example: AgentStatus.enabled, description: 'Agent 状态' })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;
}
