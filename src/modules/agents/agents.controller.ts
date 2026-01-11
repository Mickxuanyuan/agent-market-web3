import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgentDto } from './dto/agent.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../../common/auth/types';
import { parseIdAsBigInt } from '../../common/ids';
import { AgentsService } from './agents.service';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  // 将 Drizzle 返回的行（bigint/date 等）转换为 DTO（string），便于 JSON 返回与 Swagger 展示。
  private toDto(row: {
    id: bigint;
    ownerUserId: bigint;
    name: string;
    url: string;
    description: string | null;
    price: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): AgentDto {
    return {
      id: row.id.toString(),
      ownerUserId: row.ownerUserId.toString(),
      name: row.name,
      url: row.url,
      description: row.description ?? undefined,
      price: row.price,
      status: row.status as AgentDto['status'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  @Post()
  @ApiOperation({ summary: '创建 Agent', description: '注册新的 Agent（包含价格与执行地址）。' })
  @ApiOkResponse({ type: AgentDto })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateAgentDto,
  ): Promise<AgentDto> {
    const row = await this.agents.create(user, dto);
    return this.toDto(row);
  }

  @Get()
  @ApiOperation({ summary: 'Agent 列表', description: '返回所有 Agent（MVP 暂不分页）。' })
  @ApiOkResponse({ type: [AgentDto] })
  async findAll(): Promise<AgentDto[]> {
    const rows = await this.agents.findAll();
    return rows.map((r) => this.toDto(r));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Agent 详情', description: '根据 ID 获取 Agent 详情。' })
  @ApiOkResponse({ type: AgentDto })
  async findOne(@Param('id') id: string): Promise<AgentDto> {
    // 路由参数是 string，这里统一解析为 bigint（和 schema 一致）
    const row = await this.agents.findOne(parseIdAsBigInt(id));
    return this.toDto(row);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新 Agent', description: '更新 Agent 字段或状态。' })
  @ApiOkResponse({ type: AgentDto })
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentDto> {
    const row = await this.agents.update(user, parseIdAsBigInt(id), dto);
    return this.toDto(row);
  }
}
