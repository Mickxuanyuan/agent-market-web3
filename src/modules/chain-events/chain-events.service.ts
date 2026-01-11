import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createPublicClient, http, parseAbiItem } from 'viem';
import type { PublicClient } from 'viem';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { chainEvents, withdrawals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { WithdrawalStatus } from '../../common/enums';

type ChainConfig = {
  chainId: number;
  rpcUrl: string;
  contractAddress: `0x${string}`;
  startBlock: bigint;
  pollIntervalMs: number;
};

@Injectable()
export class ChainEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChainEventsService.name);
  private client: PublicClient | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastProcessedBlock: bigint | null = null;

  // 注入数据库访问服务。
  constructor(private readonly drizzle: DrizzleService) {}

  // 模块初始化时启动链上事件轮询。
  async onModuleInit() {
    const config = this.loadConfig();
    if (!config) {
      this.logger.warn('链上事件同步未启用：缺少必要配置');
      return;
    }

    this.client = createPublicClient({
      transport: http(config.rpcUrl),
    });
    this.lastProcessedBlock = config.startBlock - 1n;

    await this.pollOnce(config);

    this.pollTimer = setInterval(() => {
      void this.pollOnce(config);
    }, config.pollIntervalMs);
  }

  // 模块销毁时停止轮询。
  async onModuleDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // 读取环境变量并构造链上配置。
  private loadConfig(): ChainConfig | null {
    const chainId = Number(process.env.CHAIN_ID ?? '');
    const rpcUrl = process.env.RPC_URL ?? '';
    const contractAddress = process.env.CONTRACT_ADDRESS ?? '';
    const startBlockRaw = process.env.START_BLOCK ?? '';
    const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? '15000');

    if (
      !Number.isInteger(chainId) ||
      !rpcUrl ||
      !contractAddress ||
      !startBlockRaw
    ) {
      return null;
    }

    const startBlock = BigInt(startBlockRaw);
    return {
      chainId,
      rpcUrl,
      contractAddress: contractAddress as `0x${string}`,
      startBlock,
      pollIntervalMs,
    };
  }

  // 轮询一次链上事件并写入数据库。
  private async pollOnce(config: ChainConfig) {
    if (!this.client || this.lastProcessedBlock === null) {
      return;
    }

    try {
      const latestBlock = await this.client.getBlockNumber();
      if (latestBlock <= this.lastProcessedBlock) {
        return;
      }

      const fromBlock = this.lastProcessedBlock + 1n;
      const toBlock = latestBlock;

      const withdrawConfirmedAbi = parseAbiItem(
        'event WithdrawConfirmed(uint256 withdrawalId, bytes32 txHash)',
      );
      const withdrawFailedAbi = parseAbiItem(
        'event WithdrawFailed(uint256 withdrawalId, string reason)',
      );

      const [confirmedLogs, failedLogs] = await Promise.all([
        this.client.getLogs({
          address: config.contractAddress,
          fromBlock,
          toBlock,
          event: withdrawConfirmedAbi,
        }),
        this.client.getLogs({
          address: config.contractAddress,
          fromBlock,
          toBlock,
          event: withdrawFailedAbi,
        }),
      ]);

      for (const log of confirmedLogs) {
        await this.handleWithdrawConfirmed(config, log);
      }
      for (const log of failedLogs) {
        await this.handleWithdrawFailed(config, log);
      }

      this.lastProcessedBlock = toBlock;
    } catch (error) {
      this.logger.error('链上事件同步失败', error as Error);
    }
  }

  // 处理提现确认事件：写入 chain_events 并更新提现状态。
  private async handleWithdrawConfirmed(
    config: ChainConfig,
    log: {
      args: { withdrawalId?: bigint; txHash?: `0x${string}` };
      blockNumber: bigint;
      transactionHash: `0x${string}`;
      logIndex: number;
    },
  ) {
    const withdrawalId = log.args.withdrawalId;
    if (!withdrawalId) return;

    const inserted = await this.drizzle.db
      .insert(chainEvents)
      .values({
        chainId: BigInt(config.chainId),
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        eventType: 'WithdrawConfirmed',
        payloadJson: {
          withdrawalId: withdrawalId.toString(),
          txHash: log.args.txHash ?? log.transactionHash,
        },
        blockNumber: log.blockNumber,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: chainEvents.id });

    if (!inserted[0]) return;

    await this.drizzle.db
      .update(withdrawals)
      .set({
        status: WithdrawalStatus.confirmed,
        txHash: log.args.txHash ?? log.transactionHash,
        updatedAt: new Date(),
      })
      .where(eq(withdrawals.id, withdrawalId));
  }

  // 处理提现失败事件：写入 chain_events 并更新提现状态。
  private async handleWithdrawFailed(
    config: ChainConfig,
    log: {
      args: { withdrawalId?: bigint; reason?: string };
      blockNumber: bigint;
      transactionHash: `0x${string}`;
      logIndex: number;
    },
  ) {
    const withdrawalId = log.args.withdrawalId;
    if (!withdrawalId) return;

    const inserted = await this.drizzle.db
      .insert(chainEvents)
      .values({
        chainId: BigInt(config.chainId),
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        eventType: 'WithdrawFailed',
        payloadJson: {
          withdrawalId: withdrawalId.toString(),
          reason: log.args.reason ?? '',
        },
        blockNumber: log.blockNumber,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: chainEvents.id });

    if (!inserted[0]) return;

    await this.drizzle.db
      .update(withdrawals)
      .set({
        status: WithdrawalStatus.failed,
        updatedAt: new Date(),
      })
      .where(eq(withdrawals.id, withdrawalId));
  }
}
