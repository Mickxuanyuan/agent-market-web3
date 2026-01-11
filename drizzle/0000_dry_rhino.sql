CREATE TYPE "public"."AgentStatus" AS ENUM('enabled', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."BillStatus" AS ENUM('locked', 'released');--> statement-breakpoint
CREATE TYPE "public"."JobStatus" AS ENUM('open', 'running', 'pending_review', 'completed');--> statement-breakpoint
CREATE TYPE "public"."LedgerDirection" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."LedgerReason" AS ENUM('deposit', 'withdraw', 'job_lock', 'job_release', 'mint', 'burn');--> statement-breakpoint
CREATE TYPE "public"."WithdrawalStatus" AS ENUM('requested', 'sent', 'confirmed', 'failed');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ownerUserId" bigint NOT NULL,
	"name" varchar(80) NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"price" numeric(36, 18) NOT NULL,
	"status" "AgentStatus" DEFAULT 'enabled' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balances" (
	"userId" bigint PRIMARY KEY NOT NULL,
	"available" numeric(36, 18) DEFAULT '0' NOT NULL,
	"frozen" numeric(36, 18) DEFAULT '0' NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"jobId" bigint NOT NULL,
	"status" "BillStatus" DEFAULT 'locked' NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"releasedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chain_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"chainId" bigint NOT NULL,
	"txHash" varchar(66) NOT NULL,
	"logIndex" integer NOT NULL,
	"eventType" varchar(64) NOT NULL,
	"payloadJson" jsonb NOT NULL,
	"blockNumber" bigint NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" bigint NOT NULL,
	"agentId" bigint NOT NULL,
	"status" "JobStatus" DEFAULT 'open' NOT NULL,
	"resultText" text,
	"resultMetaJson" jsonb,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledgers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" bigint NOT NULL,
	"direction" "LedgerDirection" NOT NULL,
	"asset" varchar(16) NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"reason" "LedgerReason" NOT NULL,
	"refId" bigint,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"walletAddress" varchar(64) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" bigint NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"status" "WithdrawalStatus" DEFAULT 'requested' NOT NULL,
	"txHash" varchar(66),
	"requestedAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_ownerUserId_users_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "bills_jobId_key" ON "bills" USING btree ("jobId");--> statement-breakpoint
CREATE INDEX "bills_status_idx" ON "bills" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "chain_events_chainId_txHash_logIndex_key" ON "chain_events" USING btree ("chainId","txHash","logIndex");--> statement-breakpoint
CREATE INDEX "jobs_userId_idx" ON "jobs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "jobs_agentId_idx" ON "jobs" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ledgers_userId_idx" ON "ledgers" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users" USING btree ("walletAddress");--> statement-breakpoint
CREATE INDEX "withdrawals_status_idx" ON "withdrawals" USING btree ("status");