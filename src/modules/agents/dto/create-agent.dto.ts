import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ example: 'Copy Writer', description: 'Agent 名称' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'https://agent.example.com/run', description: 'Agent 执行地址 URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ example: 'Writes marketing copy', required: false, description: '描述（可选）' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '5.00', description: '单次执行价格（平台币）' })
  @IsNumberString()
  price: string;
}
