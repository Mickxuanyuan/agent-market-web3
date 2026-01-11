import { relations } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const jobStatusEnum = pgEnum('JobStatus', [
  'open',
  'running',
  'pending_review',
  'completed',
]);

export const billStatusEnum = pgEnum('BillStatus', ['locked', 'released']);

export const agentStatusEnum = pgEnum('AgentStatus', ['enabled', 'disabled']);

export const withdrawalStatusEnum = pgEnum('WithdrawalStatus', [
  'requested',
  'sent',
  'confirmed',
  'failed',
]);

export const ledgerDirectionEnum = pgEnum('LedgerDirection', ['credit', 'debit']);

export const ledgerReasonEnum = pgEnum('LedgerReason', [
  'deposit',
  'withdraw',
  'job_lock',
  'job_release',
  'mint',
  'burn',
]);

export const users = pgTable(
  'users',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    walletAddress: varchar('walletAddress', { length: 64 }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    walletAddressKey: uniqueIndex('users_walletAddress_key').on(
      table.walletAddress,
    ),
  }),
);

export const authNonces = pgTable(
  'auth_nonces',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    walletAddress: varchar('walletAddress', { length: 64 }).notNull(),
    nonce: varchar('nonce', { length: 64 }).notNull(),
    issuedAt: timestamp('issuedAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expiresAt', { precision: 3, mode: 'date' }).notNull(),
    usedAt: timestamp('usedAt', { precision: 3, mode: 'date' }),
  },
  (table) => ({
    nonceKey: uniqueIndex('auth_nonces_nonce_key').on(table.nonce),
    walletAddressIdx: index('auth_nonces_walletAddress_idx').on(
      table.walletAddress,
    ),
  }),
);

export const balances = pgTable(
  'balances',
  {
    userId: bigint('userId', { mode: 'bigint' })
      .primaryKey()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    available: numeric('available', { precision: 36, scale: 18 })
      .notNull()
      .default('0'),
    frozen: numeric('frozen', { precision: 36, scale: 18 })
      .notNull()
      .default('0'),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull(),
  },
);

export const agents = pgTable(
  'agents',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    ownerUserId: bigint('ownerUserId', { mode: 'bigint' })
      .notNull()
      .references(() => users.id),
    name: varchar('name', { length: 80 }).notNull(),
    url: text('url').notNull(),
    description: text('description'),
    price: numeric('price', { precision: 36, scale: 18 }).notNull(),
    status: agentStatusEnum('status').notNull().default('enabled'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull(),
  },
  (table) => ({
    statusIdx: index('agents_status_idx').on(table.status),
  }),
);

export const jobs = pgTable(
  'jobs',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    userId: bigint('userId', { mode: 'bigint' })
      .notNull()
      .references(() => users.id),
    agentId: bigint('agentId', { mode: 'bigint' })
      .notNull()
      .references(() => agents.id),
    status: jobStatusEnum('status').notNull().default('open'),
    resultText: text('resultText'),
    resultMetaJson: jsonb('resultMetaJson'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull(),
  },
  (table) => ({
    userIdIdx: index('jobs_userId_idx').on(table.userId),
    agentIdIdx: index('jobs_agentId_idx').on(table.agentId),
    statusIdx: index('jobs_status_idx').on(table.status),
  }),
);

export const bills = pgTable(
  'bills',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    jobId: bigint('jobId', { mode: 'bigint' })
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    status: billStatusEnum('status').notNull().default('locked'),
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    releasedAt: timestamp('releasedAt', { precision: 3, mode: 'date' }),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    jobIdKey: uniqueIndex('bills_jobId_key').on(table.jobId),
    statusIdx: index('bills_status_idx').on(table.status),
  }),
);

export const chainEvents = pgTable(
  'chain_events',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    chainId: bigint('chainId', { mode: 'bigint' }).notNull(),
    txHash: varchar('txHash', { length: 66 }).notNull(),
    logIndex: integer('logIndex').notNull(),
    eventType: varchar('eventType', { length: 64 }).notNull(),
    payloadJson: jsonb('payloadJson').notNull(),
    blockNumber: bigint('blockNumber', { mode: 'bigint' }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    chainEventUnique: uniqueIndex('chain_events_chainId_txHash_logIndex_key').on(
      table.chainId,
      table.txHash,
      table.logIndex,
    ),
  }),
);

export const withdrawals = pgTable(
  'withdrawals',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    userId: bigint('userId', { mode: 'bigint' })
      .notNull()
      .references(() => users.id),
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    status: withdrawalStatusEnum('status').notNull().default('requested'),
    txHash: varchar('txHash', { length: 66 }),
    requestedAt: timestamp('requestedAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull(),
  },
  (table) => ({
    statusIdx: index('withdrawals_status_idx').on(table.status),
  }),
);

export const ledgers = pgTable(
  'ledgers',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    userId: bigint('userId', { mode: 'bigint' })
      .notNull()
      .references(() => users.id),
    direction: ledgerDirectionEnum('direction').notNull(),
    asset: varchar('asset', { length: 16 }).notNull(),
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    reason: ledgerReasonEnum('reason').notNull(),
    refId: bigint('refId', { mode: 'bigint' }),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ledgers_userId_idx').on(table.userId),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  balance: one(balances, {
    fields: [users.id],
    references: [balances.userId],
  }),
  agents: many(agents),
  jobs: many(jobs),
  withdrawals: many(withdrawals),
  ledgers: many(ledgers),
}));

export const balancesRelations = relations(balances, ({ one }) => ({
  user: one(users, {
    fields: [balances.userId],
    references: [users.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  owner: one(users, {
    fields: [agents.ownerUserId],
    references: [users.id],
  }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [jobs.agentId],
    references: [agents.id],
  }),
  bill: one(bills, {
    fields: [jobs.id],
    references: [bills.jobId],
  }),
}));

export const billsRelations = relations(bills, ({ one }) => ({
  job: one(jobs, {
    fields: [bills.jobId],
    references: [jobs.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
}));

export const ledgersRelations = relations(ledgers, ({ one }) => ({
  user: one(users, {
    fields: [ledgers.userId],
    references: [users.id],
  }),
}));
