import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: '1', description: '本次任务的 Agent ID' })
  @IsString()
  agentId: string;
}
