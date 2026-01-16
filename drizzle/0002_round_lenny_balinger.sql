CREATE TYPE "public"."WalletTxType" AS ENUM('deposit', 'withdraw');--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "title" varchar(120) NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "category" varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "expectedResult" text NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "type" "WalletTxType" DEFAULT 'withdraw' NOT NULL;