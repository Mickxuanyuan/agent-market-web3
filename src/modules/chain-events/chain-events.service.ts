import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createPublicClient, decodeEventLog, http, parseAbiItem } from 'viem';
import type { PublicClient } from 'viem';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { balances, chainEvents, ledgers, users, withdrawals } from '../../drizzle/schema';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import {
  LedgerDirection,
  LedgerReason,
  WalletTxType,
  WithdrawalStatus,
} from '../../common/enums';
import { bigIntToDecimal } from '../../common/money';

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
    this.logger.log(
      `链上事件同步启用: chainId=${config.chainId}, address=${config.contractAddress}, startBlock=${config.startBlock.toString()}`,
    );

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

      const depositedAbi = parseAbiItem(
        'event Deposited(address indexed user, address indexed to, uint256 amount)',
      );
      const withdrawnAbi = parseAbiItem(
        'event Withdrawn(address indexed user, address indexed to, uint256 amount)',
      );

      const [depositedLogs, withdrawnLogs] = await Promise.all([
        this.client.getLogs({
          address: config.contractAddress,
          fromBlock,
          toBlock,
          event: depositedAbi,
        }),
        this.client.getLogs({
          address: config.contractAddress,
          fromBlock,
          toBlock,
          event: withdrawnAbi,
        }),
      ]);
      this.logger.log(
        `事件扫描: ${fromBlock.toString()} -> ${toBlock.toString()} (deposited=${depositedLogs.length}, withdrawn=${withdrawnLogs.length})`,
      );

      for (const log of depositedLogs) {
        await this.handleDeposited(config, log);
      }
      for (const log of withdrawnLogs) {
        await this.handleWithdrawn(config, log);
      }

      await this.handlePendingReceipts(config);

      this.lastProcessedBlock = toBlock;
    } catch (error) {
      this.logger.error('链上事件同步失败', error as Error);
    }
  }

  // 处理充值事件：写入 chain_events，并在确认后入账。
  private async handleDeposited(
    config: ChainConfig,
    log: {
      args: { user?: `0x${string}`; to?: `0x${string}`; amount?: bigint };
      blockNumber: bigint;
      transactionHash: `0x${string}`;
      logIndex: number;
    },
  ) {
    const userAddress = log.args.user?.toLowerCase();
    const amountRaw = log.args.amount;
    if (!userAddress || amountRaw === undefined) return;

    const amount = bigIntToDecimal(amountRaw);
    const now = new Date();

    const inserted = await this.drizzle.db
      .insert(chainEvents)
      .values({
        chainId: BigInt(config.chainId),
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        eventType: 'Deposited',
        payloadJson: {
          user: userAddress,
          to: log.args.to?.toLowerCase() ?? '',
          amount,
        },
        blockNumber: log.blockNumber,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: chainEvents.id });

    const eventInserted = Boolean(inserted[0]);
    if (!eventInserted) {
      this.logger.warn(`事件已存在，继续尝试修复状态: ${log.transactionHash}`);
    }

    const userRows = await this.drizzle.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.walletAddress, userAddress))
      .limit(1);

    const user = userRows[0];
    if (!user) {
      this.logger.warn(`未找到用户: ${userAddress}`);
      return;
    }

    await this.drizzle.db.transaction(async (tx) => {
      await tx
        .insert(balances)
        .values({
          userId: user.id,
          available: '0',
          frozen: '0',
          updatedAt: now,
        })
        .onConflictDoNothing({ target: balances.userId });

      const existingRows = await tx
        .select({ id: withdrawals.id, status: withdrawals.status })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.txHash, log.transactionHash),
            eq(withdrawals.type, WalletTxType.deposit),
          ),
        )
        .limit(1);

      const existing = existingRows[0];
      if (existing?.status === WithdrawalStatus.confirmed) {
        return;
      }

      let depositId: bigint | undefined;
      if (existing) {
        const updatedRows = await tx
          .update(withdrawals)
          .set({
            status: WithdrawalStatus.confirmed,
            updatedAt: now,
          })
          .where(
            and(
              eq(withdrawals.id, existing.id),
              eq(withdrawals.status, WithdrawalStatus.requested),
            ),
          )
          .returning({ id: withdrawals.id });
        depositId = updatedRows[0]?.id;
      } else {
        const insertedRows = await tx
          .insert(withdrawals)
          .values({
            userId: user.id,
            type: WalletTxType.deposit,
            amount,
            status: WithdrawalStatus.confirmed,
            txHash: log.transactionHash,
            requestedAt: now,
            updatedAt: now,
          })
          .returning({ id: withdrawals.id });
        depositId = insertedRows[0]?.id;
      }

      if (!depositId) {
        return;
      }

      await tx
        .update(balances)
        .set({
          available: sql`${balances.available} + ${amount}`,
          updatedAt: now,
        })
        .where(eq(balances.userId, user.id));

      if (depositId) {
        await tx.insert(ledgers).values({
          userId: user.id,
          direction: LedgerDirection.credit,
          asset: 'platform',
          amount,
          reason: LedgerReason.deposit,
          refId: depositId,
        });
      }
    });
  }

  // 处理提现事件：写入 chain_events 并更新提现状态。
  private async handleWithdrawn(
    config: ChainConfig,
    log: {
      args: { user?: `0x${string}`; to?: `0x${string}`; amount?: bigint };
      blockNumber: bigint;
      transactionHash: `0x${string}`;
      logIndex: number;
    },
  ) {
    const userAddress = log.args.user?.toLowerCase();
    const amountRaw = log.args.amount;
    if (!userAddress || amountRaw === undefined) return;

    const amount = bigIntToDecimal(amountRaw);
    const now = new Date();

    const inserted = await this.drizzle.db
      .insert(chainEvents)
      .values({
        chainId: BigInt(config.chainId),
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        eventType: 'Withdrawn',
        payloadJson: {
          user: userAddress,
          to: log.args.to?.toLowerCase() ?? '',
          amount,
        },
        blockNumber: log.blockNumber,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: chainEvents.id });

    if (!inserted[0]) {
      this.logger.warn(`事件已存在，继续尝试修复状态: ${log.transactionHash}`);
    }

    await this.drizzle.db
      .update(withdrawals)
      .set({
        status: WithdrawalStatus.confirmed,
        txHash: log.transactionHash,
        updatedAt: now,
      })
      .where(
        and(
          eq(withdrawals.txHash, log.transactionHash),
          eq(withdrawals.type, WalletTxType.withdraw),
          eq(withdrawals.status, WithdrawalStatus.requested),
        ),
      );
  }

  // 兜底：按 txHash 拉取交易回执，避免事件漏收。
  private async handlePendingReceipts(config: ChainConfig) {
    if (!this.client) return;

    const pendingRows = await this.drizzle.db
      .select({ txHash: withdrawals.txHash })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.status, WithdrawalStatus.requested),
          isNotNull(withdrawals.txHash),
        ),
      )
      .limit(50);

    if (pendingRows.length === 0) return;
    this.logger.log(`回执兜底: pending=${pendingRows.length}`);

    const depositedAbi = parseAbiItem(
      'event Deposited(address indexed user, address indexed to, uint256 amount)',
    );
    const withdrawnAbi = parseAbiItem(
      'event Withdrawn(address indexed user, address indexed to, uint256 amount)',
    );

    for (const row of pendingRows) {
      const txHash = row.txHash as `0x${string}` | null;
      if (!txHash) continue;

      try {
        const receipt = await this.client.getTransactionReceipt({ hash: txHash });

        if (receipt.status === 'reverted') {
          await this.drizzle.db
            .update(withdrawals)
            .set({
              status: WithdrawalStatus.failed,
              updatedAt: new Date(),
            })
            .where(eq(withdrawals.txHash, txHash));
          continue;
        }

        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== config.contractAddress.toLowerCase()) {
            continue;
          }

          try {
            const decoded = decodeEventLog({
              abi: [depositedAbi],
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'Deposited') {
              await this.handleDeposited(config, {
                args: decoded.args as { user?: `0x${string}`; to?: `0x${string}`; amount?: bigint },
                blockNumber: receipt.blockNumber,
                transactionHash: receipt.transactionHash,
                logIndex: log.logIndex,
              });
              continue;
            }
          } catch {
            // ignore non-matching event
          }

          try {
            const decoded = decodeEventLog({
              abi: [withdrawnAbi],
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'Withdrawn') {
              await this.handleWithdrawn(config, {
                args: decoded.args as { user?: `0x${string}`; to?: `0x${string}`; amount?: bigint },
                blockNumber: receipt.blockNumber,
                transactionHash: receipt.transactionHash,
                logIndex: log.logIndex,
              });
            }
          } catch {
            // ignore non-matching event
          }
        }
      } catch (error) {
        const message = (error as Error).message || '';
        if (message.includes('TransactionReceiptNotFound')) {
          continue;
        }
        this.logger.warn(`回执查询失败: ${txHash} (${message})`);
      }
    }
  }
}
