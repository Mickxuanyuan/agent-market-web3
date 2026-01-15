import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateJobDto } from './dto/create-job.dto';
import { JobDto } from './dto/job.dto';
import { SubmitResultDto } from './dto/submit-result.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../../common/auth/types';
import { parseIdAsBigInt } from '../../common/ids';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  // 注入业务服务。
  constructor(private readonly jobs: JobsService) {}

  // Drizzle 返回的 bigint/date/json 等，转换为 Swagger 友好的 DTO（string/object）。
  private toDto(row: {
    id: bigint;
    userId: bigint;
    agentId: bigint;
    title: string;
    category: string;
    description: string;
    expectedResult: string;
    status: string;
    resultText: string | null;
    resultMetaJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): JobDto {
    return {
      id: row.id.toString(),
      userId: row.userId.toString(),
      agentId: row.agentId.toString(),
      title: row.title,
      category: row.category,
      description: row.description,
      expectedResult: row.expectedResult,
      status: row.status as JobDto['status'],
      resultText: row.resultText ?? undefined,
      resultMetaJson:
        (row.resultMetaJson as Record<string, unknown> | null) ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  @Post()
  @ApiOperation({ summary: '创建 Job', description: '创建任务并冻结对应余额。' })
  @ApiOkResponse({ type: JobDto })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateJobDto,
  ): Promise<JobDto> {
    const row = await this.jobs.create(user, dto);
    return this.toDto(row);
  }

  @Get()
  @ApiOperation({ summary: 'Job 列表', description: '返回所有任务（MVP 暂不分页）。' })
  @ApiOkResponse({ type: [JobDto] })
  async findAll(@CurrentUser() user: CurrentUserType): Promise<JobDto[]> {
    const rows = await this.jobs.findAll(user);
    return rows.map((r) => this.toDto(r));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Job 详情', description: '根据 ID 获取任务详情。' })
  @ApiOkResponse({ type: JobDto })
  async findOne(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ): Promise<JobDto> {
    const row = await this.jobs.findOne(user, parseIdAsBigInt(id));
    return this.toDto(row);
  }

  @Post(':id/submit-result')
  @ApiOperation({ summary: '提交执行结果', description: 'Agent 提交结果，进入待确认状态。' })
  @ApiOkResponse({ type: JobDto })
  async submitResult(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: SubmitResultDto,
  ): Promise<JobDto> {
    // 注意：这里的 user 是“当前请求头对应的用户”
    // - 如果你想模拟 Agent 提交结果，请用 Agent owner 的 X-Wallet-Address 调用该接口
    const row = await this.jobs.submitResult(user, parseIdAsBigInt(id), dto);
    return this.toDto(row);
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: '确认执行结果并结算',
    description: '用户确认结果后释放冻结余额并完成结算。',
  })
  @ApiOkResponse({ type: JobDto })
  async confirm(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ): Promise<JobDto> {
    // 注意：这里需要 job 创建者的 X-Wallet-Address 调用
    const row = await this.jobs.confirm(user, parseIdAsBigInt(id));
    return this.toDto(row);
  }
}
