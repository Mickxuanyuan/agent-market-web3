CREATE TABLE "auth_nonces" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"walletAddress" varchar(64) NOT NULL,
	"nonce" varchar(64) NOT NULL,
	"issuedAt" timestamp (3) DEFAULT now() NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"usedAt" timestamp (3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_nonces_nonce_key" ON "auth_nonces" USING btree ("nonce");--> statement-breakpoint
CREATE INDEX "auth_nonces_walletAddress_idx" ON "auth_nonces" USING btree ("walletAddress");