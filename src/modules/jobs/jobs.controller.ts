import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobStatus } from '../../common/enums';
import { CreateJobDto } from './dto/create-job.dto';
import { JobDto } from './dto/job.dto';
import { SubmitResultDto } from './dto/submit-result.dto';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  @Post()
  @ApiOperation({ summary: '创建 Job', description: '创建任务并冻结对应余额。' })
  @ApiOkResponse({ type: JobDto })
  create(@Body() _dto: CreateJobDto): JobDto {
    // Swagger 示例返回，后续替换为真实逻辑。
    return {
      id: '1',
      userId: '1',
      agentId: '1',
      status: JobStatus.open,
      resultText: undefined,
      resultMetaJson: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Job 列表', description: '返回所有任务（MVP 暂不分页）。' })
  @ApiOkResponse({ type: [JobDto] })
  findAll(): JobDto[] {
    // Swagger 示例返回。
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Job 详情', description: '根据 ID 获取任务详情。' })
  @ApiOkResponse({ type: JobDto })
  findOne(@Param('id') _id: string): JobDto {
    // Swagger 示例返回。
    return {
      id: '1',
      userId: '1',
      agentId: '1',
      status: JobStatus.open,
      resultText: undefined,
      resultMetaJson: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(':id/submit-result')
  @ApiOperation({ summary: '提交执行结果', description: 'Agent 提交结果，进入待确认状态。' })
  @ApiOkResponse({ type: JobDto })
  submitResult(@Param('id') _id: string, @Body() _dto: SubmitResultDto): JobDto {
    // Swagger 示例返回。
    return {
      id: '1',
      userId: '1',
      agentId: '1',
      status: JobStatus.pendingReview,
      resultText: 'Result text',
      resultMetaJson: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认执行结果', description: '用户确认结果并触发结算。' })
  @ApiOkResponse({ type: JobDto })
  confirm(@Param('id') _id: string): JobDto {
    // Swagger 示例返回。
    return {
      id: '1',
      userId: '1',
      agentId: '1',
      status: JobStatus.completed,
      resultText: 'Result text',
      resultMetaJson: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
