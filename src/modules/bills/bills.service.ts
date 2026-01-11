import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { CurrentUser } from '../../common/auth/types';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { bills, jobs } from '../../drizzle/schema';

@Injectable()
export class BillsService {
  // 注入数据库访问服务。
  constructor(private readonly drizzle: DrizzleService) {}

  // 账单列表：仅返回当前用户的账单，按创建时间倒序。
  async listForUser(user: CurrentUser) {
    return this.drizzle.db
      .select({
        id: bills.id,
        jobId: bills.jobId,
        status: bills.status,
        amount: bills.amount,
        releasedAt: bills.releasedAt,
        createdAt: bills.createdAt,
      })
      .from(bills)
      .innerJoin(jobs, eq(bills.jobId, jobs.id))
      .where(eq(jobs.userId, user.id))
      .orderBy(desc(bills.createdAt));
  }

  // 账单详情：仅允许查看自己的账单。
  async findOneForUser(user: CurrentUser, id: bigint) {
    const rows = await this.drizzle.db
      .select({
        id: bills.id,
        jobId: bills.jobId,
        status: bills.status,
        amount: bills.amount,
        releasedAt: bills.releasedAt,
        createdAt: bills.createdAt,
      })
      .from(bills)
      .innerJoin(jobs, eq(bills.jobId, jobs.id))
      .where(and(eq(bills.id, id), eq(jobs.userId, user.id)))
      .limit(1);

    if (!rows[0]) {
      throw new NotFoundException('Bill not found');
    }
    return rows[0];
  }
}
