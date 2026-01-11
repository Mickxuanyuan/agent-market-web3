import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { CurrentUser } from '../../common/auth/types';
import { decimalToBigInt } from '../../common/money';
import { DrizzleService } from '../../drizzle/drizzle.service';
import {
  AgentStatus,
  BillStatus,
  JobStatus,
  LedgerDirection,
  LedgerReason,
} from '../../common/enums';
import { agents, balances, bills, jobs, ledgers } from '../../drizzle/schema';
import type { CreateJobDto } from './dto/create-job.dto';
import type { SubmitResultDto } from './dto/submit-result.dto';

const ASSET_SYMBOL = 'platform';

@Injectable()
export class JobsService {
  // 注入数据库访问服务。
  constructor(private readonly drizzle: DrizzleService) {}

  // 创建 Job（用户发起）：
  // 1) 校验 Agent 存在且 enabled
  // 2) 校验用户 available 足够支付 agent.price
  // 3) 扣 available、加 frozen（冻结）
  // 4) 创建 jobs（status=open）+ bills（status=locked，amount=price）
  // 全部在事务中完成，避免中间状态不一致。
  async create(user: CurrentUser, dto: CreateJobDto) {
    const agentId = BigInt(dto.agentId);
    const now = new Date();

    return this.drizzle.db.transaction(async (tx) => {
      const agentRow = await tx
        .select({
          id: agents.id,
          ownerUserId: agents.ownerUserId,
          price: agents.price,
          status: agents.status,
        })
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1);

      if (!agentRow[0]) throw new NotFoundException('Agent not found');
      if (agentRow[0].status !== AgentStatus.enabled) {
        throw new BadRequestException('Agent is disabled');
      }

      // balances 行可能不存在（第一次用户出现），先初始化
      await tx
        .insert(balances)
        .values({
          userId: user.id,
          available: '0',
          frozen: '0',
          updatedAt: now,
        })
        .onConflictDoNothing({ target: balances.userId });

      const balanceRow = await tx
        .select({ available: balances.available, frozen: balances.frozen })
        .from(balances)
        .where(eq(balances.userId, user.id))
        .limit(1);

      // 使用 BigInt 做比较，避免 number 精度问题
      const availableWei = decimalToBigInt(balanceRow[0]?.available ?? '0');
      const priceWei = decimalToBigInt(agentRow[0].price);
      if (availableWei < priceWei) {
        throw new BadRequestException('Insufficient balance');
      }

      // 冻结：available -= price，frozen += price
      await tx
        .update(balances)
        .set({
          available: sql`${balances.available} - ${agentRow[0].price}`,
          frozen: sql`${balances.frozen} + ${agentRow[0].price}`,
          updatedAt: now,
        })
        .where(eq(balances.userId, user.id));

      const insertedJob = await tx
        .insert(jobs)
        .values({
          userId: user.id,
          agentId,
          status: JobStatus.running,
          updatedAt: now,
        })
        .returning();

      const jobRow = insertedJob[0];

      // 账单：锁定状态（确认后释放给 Agent）
      await tx.insert(bills).values({
        jobId: jobRow.id,
        amount: agentRow[0].price,
      });

      return jobRow;
    });
  }

  // 用户视角：只返回自己创建的 jobs
  async findAll(user: CurrentUser) {
    return this.drizzle.db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, user.id));
  }

  // 用户视角：只能看自己的单个 job
  async findOne(user: CurrentUser, id: bigint) {
    const rows = await this.drizzle.db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.userId, user.id)))
      .limit(1);
    if (!rows[0]) throw new NotFoundException('Job not found');
    return rows[0];
  }

  // Agent 提交结果：
  // 只有该 job 对应 agent 的 owner 才能提交（MVP：认为 owner 就是 agent 执行者）
  // 当前版本直接完成结算：job.status -> completed（跳过 pending_review）。
  async submitResult(user: CurrentUser, jobId: bigint, dto: SubmitResultDto) {
    const rows = await this.drizzle.db
      .select({
        jobId: jobs.id,
        jobStatus: jobs.status,
        jobResultText: jobs.resultText,
        jobResultMetaJson: jobs.resultMetaJson,
        jobCreatedAt: jobs.createdAt,
        jobUpdatedAt: jobs.updatedAt,
        jobUserId: jobs.userId,
        jobAgentId: jobs.agentId,
        agentOwnerUserId: agents.ownerUserId,
      })
      .from(jobs)
      .innerJoin(agents, eq(jobs.agentId, agents.id))
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!rows[0]) throw new NotFoundException('Job not found');
    if (rows[0].agentOwnerUserId !== user.id) {
      throw new ForbiddenException('Only agent owner can submit result');
    }

    if (rows[0].jobStatus === JobStatus.completed) {
      return {
        id: rows[0].jobId,
        userId: rows[0].jobUserId,
        agentId: rows[0].jobAgentId,
        status: rows[0].jobStatus,
        resultText: rows[0].jobResultText,
        resultMetaJson: rows[0].jobResultMetaJson,
        createdAt: rows[0].jobCreatedAt,
        updatedAt: rows[0].jobUpdatedAt,
      };
    }

    if (
      rows[0].jobStatus !== JobStatus.open &&
      rows[0].jobStatus !== JobStatus.running
    ) {
      throw new BadRequestException('Job is not executable');
    }

    const now = new Date();
    return this.drizzle.db.transaction(async (tx) => {
      // 1) 写入执行结果并将 job 直接完成
      const updatedJobs = await tx
        .update(jobs)
        .set({
          status: JobStatus.completed,
          resultText: dto.resultText,
          resultMetaJson: dto.resultMetaJson,
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId))
        .returning();

      const jobRow = updatedJobs[0];

      // 2) 读取账单并校验状态
      const billRows = await tx
        .select({
          billId: bills.id,
          billAmount: bills.amount,
          billStatus: bills.status,
        })
        .from(bills)
        .where(eq(bills.jobId, jobId))
        .limit(1);

      const bill = billRows[0];
      if (!bill) {
        throw new NotFoundException('Bill not found');
      }
      if (bill.billStatus === BillStatus.released) {
        return jobRow;
      }
      if (bill.billStatus !== BillStatus.locked) {
        throw new BadRequestException('Bill is not locked');
      }

      // 3) 释放账单
      await tx
        .update(bills)
        .set({ status: BillStatus.released, releasedAt: now })
        .where(eq(bills.id, bill.billId));

      // 4) 从创建者冻结余额扣除
      await tx
        .update(balances)
        .set({
          frozen: sql`${balances.frozen} - ${bill.billAmount}`,
          updatedAt: now,
        })
        .where(eq(balances.userId, rows[0].jobUserId));

      // 5) 确保 agentOwner 的 balances 行存在
      await tx
        .insert(balances)
        .values({
          userId: rows[0].agentOwnerUserId,
          available: '0',
          frozen: '0',
          updatedAt: now,
        })
        .onConflictDoNothing({ target: balances.userId });

      // 6) 增加 agentOwner 可用余额
      await tx
        .update(balances)
        .set({
          available: sql`${balances.available} + ${bill.billAmount}`,
          updatedAt: now,
        })
        .where(eq(balances.userId, rows[0].agentOwnerUserId));

      // 7) 记流水（用于审计/对账）
      await tx.insert(ledgers).values([
        {
          userId: rows[0].jobUserId,
          direction: LedgerDirection.debit,
          asset: ASSET_SYMBOL,
          amount: bill.billAmount,
          reason: LedgerReason.jobRelease,
          refId: jobId,
        },
        {
          userId: rows[0].agentOwnerUserId,
          direction: LedgerDirection.credit,
          asset: ASSET_SYMBOL,
          amount: bill.billAmount,
          reason: LedgerReason.jobRelease,
          refId: jobId,
        },
      ]);

      return jobRow;
    });
  }

  // 用户确认结果并结算（已废弃）：
  // 当前版本由 submitResult 直接完成结算，保留此接口做兼容。
  async confirm(user: CurrentUser, jobId: bigint) {
    const rows = await this.drizzle.db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.userId, user.id)))
      .limit(1);
    if (!rows[0]) throw new NotFoundException('Job not found');
    return rows[0];
  }
}
