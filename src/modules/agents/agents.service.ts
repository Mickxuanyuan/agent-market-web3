import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { agents } from '../../drizzle/schema';
import type { CurrentUser } from '../../common/auth/types';
import type { CreateAgentDto } from './dto/create-agent.dto';
import type { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentStatus } from '../../common/enums';

@Injectable()
export class AgentsService {
  // 注入数据库访问服务。
  constructor(private readonly drizzle: DrizzleService) {}

  // 规范化名称：去除首尾空格。
  private normalizeName(value: string) {
    return value.trim();
  }

  // 规范化 URL：去除首尾空格。
  private normalizeUrl(value: string) {
    return value.trim();
  }

  // 检查同一用户下名称是否重复（可排除指定 id）。
  private async assertNameUnique(
    ownerUserId: bigint,
    name: string,
    excludeId?: bigint,
  ) {
    const conditions = [eq(agents.ownerUserId, ownerUserId), eq(agents.name, name)];
    if (excludeId) {
      conditions.push(sql`${agents.id} <> ${excludeId}`);
    }

    const rows = await this.drizzle.db
      .select({ id: agents.id })
      .from(agents)
      .where(and(...conditions))
      .limit(1);

    if (rows[0]) {
      throw new BadRequestException('Agent name already exists');
    }
  }

  // 创建 Agent：归属到当前用户（ownerUserId），并写入更新时间。
  async create(user: CurrentUser, dto: CreateAgentDto) {
    const name = this.normalizeName(dto.name);
    const url = this.normalizeUrl(dto.url);
    await this.assertNameUnique(user.id, name);
    const now = new Date();
    const rows = await this.drizzle.db
      .insert(agents)
      .values({
        ownerUserId: user.id,
        name,
        url,
        description: dto.description,
        price: dto.price,
        updatedAt: now,
      })
      .returning();
    return rows[0];
  }

  // 列表：支持分页与筛选（status、ownerUserId），同时返回总数。
  async findAll(params: {
    page: number;
    pageSize: number;
    status?: AgentStatus;
    ownerUserId?: bigint;
  }): Promise<{ items: typeof agents.$inferSelect[]; total: number }> {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = [];

    if (params.status) {
      conditions.push(eq(agents.status, params.status));
    }
    if (params.ownerUserId) {
      conditions.push(eq(agents.ownerUserId, params.ownerUserId));
    }

    const baseQuery = this.drizzle.db
      .select()
      .from(agents)
      .limit(params.pageSize)
      .offset(offset);

    const countQuery = this.drizzle.db
      .select({ total: sql<number>`count(*)` })
      .from(agents);

    if (conditions.length === 0) {
      const [items, totals] = await Promise.all([
        baseQuery,
        countQuery,
      ]);
      return { items, total: totals[0]?.total ?? 0 };
    }

    const where = and(...conditions);
    const [items, totals] = await Promise.all([
      baseQuery.where(where),
      countQuery.where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  // 详情：按 ID 查询，找不到则抛出 404。
  async findOne(id: bigint) {
    const row = await this.drizzle.db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);
    if (!row[0]) throw new NotFoundException('Agent not found');
    return row[0];
  }

  // 详情（我的）：仅允许 owner 查看，否则 Forbidden。
  async findOneOwned(user: CurrentUser, id: bigint) {
    const row = await this.findOne(id);
    if (row.ownerUserId !== user.id) {
      throw new ForbiddenException('Not agent owner');
    }
    return row;
  }

  // 更新：仅允许 owner 更新，字段按“有值则覆盖”的策略合并。
  async update(user: CurrentUser, id: bigint, dto: UpdateAgentDto) {
    const existing = await this.findOne(id);
    if (existing.ownerUserId !== user.id) {
      throw new ForbiddenException('Not agent owner');
    }

    const name = dto.name ? this.normalizeName(dto.name) : existing.name;
    const url = dto.url ? this.normalizeUrl(dto.url) : existing.url;
    if (name !== existing.name) {
      await this.assertNameUnique(user.id, name, id);
    }

    const now = new Date();
    const rows = await this.drizzle.db
      .update(agents)
      .set({
        name,
        url,
        description:
          dto.description === undefined ? existing.description : dto.description,
        price: dto.price ?? existing.price,
        status: dto.status ?? existing.status,
        updatedAt: now,
      })
      .where(eq(agents.id, id))
      .returning();

    return rows[0];
  }

  // 下架：仅允许 owner 下架，状态改为 disabled。
  async disable(user: CurrentUser, id: bigint) {
    const existing = await this.findOne(id);
    if (existing.ownerUserId !== user.id) {
      throw new ForbiddenException('Not agent owner');
    }

    const now = new Date();
    const rows = await this.drizzle.db
      .update(agents)
      .set({
        status: AgentStatus.disabled,
        updatedAt: now,
      })
      .where(eq(agents.id, id))
      .returning();

    return rows[0];
  }
}
