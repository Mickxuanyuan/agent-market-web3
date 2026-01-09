import { ApiProperty } from '@nestjs/swagger';
import { AgentStatus } from '../../../common/enums';

export class AgentDto {
  @ApiProperty({ example: '1', description: 'Agent 标识 ID' })
  id: string;

  @ApiProperty({ example: '1', description: '创建者用户 ID' })
  ownerUserId: string;

  @ApiProperty({ example: 'Copy Writer', description: 'Agent 名称' })
  name: string;

  @ApiProperty({
    example: 'https://agent.example.com/run',
    description: 'Agent 执行地址 URL',
  })
  url: string;

  @ApiProperty({ example: 'Writes marketing copy', required: false, description: '描述（可选）' })
  description?: string;

  @ApiProperty({ example: '5.00', description: '单次执行价格（平台币）' })
  price: string;

  @ApiProperty({ enum: AgentStatus, example: AgentStatus.enabled, description: 'Agent 状态' })
  status: AgentStatus;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '创建时间' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '更新时间' })
  updatedAt: string;
}
