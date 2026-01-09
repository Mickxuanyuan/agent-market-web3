import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitResultDto {
  @ApiPropertyOptional({ example: 'Result text', description: '结果文本（可选）' })
  @IsOptional()
  @IsString()
  resultText?: string;

  @ApiPropertyOptional({ type: Object, description: '结果元数据（图片/文件 URL，可选）' })
  @IsOptional()
  @IsObject()
  resultMetaJson?: Record<string, unknown>;
}
