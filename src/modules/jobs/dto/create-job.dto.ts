import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: '1', description: '本次任务的 Agent ID' })
  @IsNumberString({ no_symbols: true })
  agentId: string;

  @ApiProperty({ example: '分析 2024 Q1 财报', description: '任务标题' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: '文本处理', description: '任务分类' })
  @IsString()
  @MaxLength(80)
  category: string;

  @ApiProperty({ example: '详细说明任务目标与具体要求', description: '任务描述' })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: 'JSON 格式数据，包含字段 A、B、C', description: '预期交付结果' })
  @IsString()
  @MaxLength(2000)
  expectedResult: string;
}
