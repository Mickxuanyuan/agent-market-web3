import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from '../../../common/enums';

export class JobDto {
  @ApiProperty({ example: '1', description: 'Job 标识 ID' })
  id: string;

  @ApiProperty({ example: '1', description: '任务创建者用户 ID' })
  userId: string;

  @ApiProperty({ example: '1', description: '关联 Agent ID' })
  agentId: string;

  @ApiProperty({ example: '分析 2024 Q1 财报', description: '任务标题' })
  title: string;

  @ApiProperty({ example: '文本处理', description: '任务分类' })
  category: string;

  @ApiProperty({ example: '详细说明任务目标与具体要求', description: '任务描述' })
  description: string;

  @ApiProperty({ example: 'JSON 格式数据，包含字段 A、B、C', description: '预期交付结果' })
  expectedResult: string;

  @ApiProperty({ enum: JobStatus, example: JobStatus.open, description: '任务状态' })
  status: JobStatus;

  @ApiProperty({ example: 'Result text', required: false, description: '结果文本（可选）' })
  resultText?: string;

  @ApiProperty({ type: Object, required: false, description: '结果元数据（图片/文件 URL，可选）' })
  resultMetaJson?: Record<string, unknown>;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '创建时间' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '更新时间' })
  updatedAt: string;
}
