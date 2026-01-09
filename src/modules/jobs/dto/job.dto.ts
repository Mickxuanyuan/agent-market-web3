import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from '../../../common/enums';

export class JobDto {
  @ApiProperty({ example: '1', description: 'Job 标识 ID' })
  id: string;

  @ApiProperty({ example: '1', description: '任务创建者用户 ID' })
  userId: string;

  @ApiProperty({ example: '1', description: '关联 Agent ID' })
  agentId: string;

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
