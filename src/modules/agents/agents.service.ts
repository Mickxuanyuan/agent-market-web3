import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { agents } from '../../drizzle/schema';
import type { CurrentUser } from '../../common/auth/types';
import type { CreateAgentDto } from './dto/create-agent.dto';
import type { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  // 创建 Agent：归属到当前用户（ownerUserId）
  async create(user: CurrentUser, dto: CreateAgentDto) {
    const now = new Date();
    const rows = await this.drizzle.db
      .insert(agents)
      .values({
        ownerUserId: user.id,
        name: dto.name,
        url: dto.url,
        description: dto.description,
        price: dto.price,
        updatedAt: now,
      })
      .returning();
    return rows[0];
  }

  // 列表：MVP 暂不分页
  async findAll() {
    return this.drizzle.db.select().from(agents);
  }

  // 详情
  async findOne(id: bigint) {
    const row = await this.drizzle.db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);
    if (!row[0]) throw new NotFoundException('Agent not found');
    return row[0];
  }

  // 更新：只允许 owner 更新（否则 Forbidden）
  async update(user: CurrentUser, id: bigint, dto: UpdateAgentDto) {
    const existing = await this.findOne(id);
    if (existing.ownerUserId !== user.id) {
      throw new ForbiddenException('Not agent owner');
    }

    const now = new Date();
    const rows = await this.drizzle.db
      .update(agents)
      .set({
        name: dto.name ?? existing.name,
        url: dto.url ?? existing.url,
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
}
