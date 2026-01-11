import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AgentDto } from './dto/agent.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentsListDto } from './dto/agents-list.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../../common/auth/types';
import { parseIdAsBigInt } from '../../common/ids';
import { AgentsService } from './agents.service';
import { AgentStatus } from '../../common/enums';

@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
  // 注入业务服务。
  constructor(private readonly agents: AgentsService) {}

  // 解析页码参数，要求为 >= 1 的整数。
  private parsePage(value: string | undefined) {
    if (!value) return 1;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException('Invalid page');
    }
    return parsed;
  }

  // 解析每页条数参数，限制范围 [1, 100]。
  private parsePageSize(value: string | undefined) {
    if (!value) return 20;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new BadRequestException('Invalid pageSize');
    }
    return parsed;
  }

  // 解析状态参数，仅允许枚举值。
  private parseStatus(value: string | undefined) {
    if (!value) return undefined;
    const allowed = new Set(Object.values(AgentStatus));
    if (!allowed.has(value as AgentStatus)) {
      throw new BadRequestException('Invalid status');
    }
    return value as AgentStatus;
  }

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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建 Agent', description: '注册新的 Agent（包含价格与执行地址）。' })
  @ApiOkResponse({ type: AgentDto })
  // 创建：使用当前登录用户作为 ownerUserId。
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateAgentDto,
  ): Promise<AgentDto> {
    const row = await this.agents.create(user, dto);
    return this.toDto(row);
  }

  @Get()
  @ApiOperation({ summary: 'Agent 列表（公开）', description: '公开列表仅展示 enabled，支持分页。' })
  @ApiQuery({ name: 'page', required: false, description: '页码，从 1 开始' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数，默认 20，最大 100' })
  @ApiOkResponse({ type: AgentsListDto })
  // 列表：按分页与筛选条件返回 Agent。
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<AgentsListDto> {
    const pageValue = this.parsePage(page);
    const pageSizeValue = this.parsePageSize(pageSize);
    const { items, total } = await this.agents.findAll({
      page: pageValue,
      pageSize: pageSizeValue,
      status: AgentStatus.enabled,
    });

    const totalPages =
      total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSizeValue));

    return {
      items: items.map((r) => this.toDto(r)),
      meta: {
        page: pageValue,
        pageSize: pageSizeValue,
        total,
        totalPages,
      },
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '我的 Agent 列表', description: '仅返回当前用户拥有的 Agent，支持分页与状态筛选。' })
  @ApiQuery({ name: 'page', required: false, description: '页码，从 1 开始' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数，默认 20，最大 100' })
  @ApiQuery({ name: 'status', required: false, description: 'enabled/disabled' })
  @ApiOkResponse({ type: AgentsListDto })
  // 我的列表：强制按 ownerUserId=当前用户过滤。
  async findMine(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ): Promise<AgentsListDto> {
    const pageValue = this.parsePage(page);
    const pageSizeValue = this.parsePageSize(pageSize);
    const { items, total } = await this.agents.findAll({
      page: pageValue,
      pageSize: pageSizeValue,
      status: this.parseStatus(status),
      ownerUserId: user.id,
    });

    const totalPages =
      total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSizeValue));

    return {
      items: items.map((r) => this.toDto(r)),
      meta: {
        page: pageValue,
        pageSize: pageSizeValue,
        total,
        totalPages,
      },
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Agent 详情', description: '根据 ID 获取 Agent 详情。' })
  @ApiOkResponse({ type: AgentDto })
  // 详情：ID 字符串统一转为 bigint 再查询。
  async findOne(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ): Promise<AgentDto> {
    // 路由参数是 string，这里统一解析为 bigint（和 schema 一致）
    const row = await this.agents.findOneOwned(user, parseIdAsBigInt(id));
    return this.toDto(row);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新 Agent', description: '更新 Agent 字段或状态。' })
  @ApiOkResponse({ type: AgentDto })
  // 更新：仅 owner 可更新，字段合并逻辑由 service 处理。
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentDto> {
    const row = await this.agents.update(user, parseIdAsBigInt(id), dto);
    return this.toDto(row);
  }

  @Patch(':id/disable')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '下架 Agent', description: '仅 owner 可下架，状态置为 disabled。' })
  @ApiOkResponse({ type: AgentDto })
  // 下架：仅 owner 可下架。
  async disable(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ): Promise<AgentDto> {
    const row = await this.agents.disable(user, parseIdAsBigInt(id));
    return this.toDto(row);
  }
}
