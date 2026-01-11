import { ApiProperty } from '@nestjs/swagger';
import { AgentDto } from './agent.dto';

class AgentsListMetaDto {
  @ApiProperty({ example: 1, description: '页码（从 1 开始）' })
  page: number;

  @ApiProperty({ example: 20, description: '每页条数' })
  pageSize: number;

  @ApiProperty({ example: 120, description: '总条数' })
  total: number;

  @ApiProperty({ example: 6, description: '总页数' })
  totalPages: number;
}

export class AgentsListDto {
  @ApiProperty({ type: [AgentDto], description: 'Agent 列表' })
  items: AgentDto[];

  @ApiProperty({ type: AgentsListMetaDto, description: '分页信息' })
  meta: AgentsListMetaDto;
}
