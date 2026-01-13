ALTER TABLE "jobs" ADD COLUMN "title" varchar(120) NOT NULL DEFAULT '';
ALTER TABLE "jobs" ADD COLUMN "category" varchar(80) NOT NULL DEFAULT '';
ALTER TABLE "jobs" ADD COLUMN "description" text NOT NULL DEFAULT '';
ALTER TABLE "jobs" ADD COLUMN "expectedResult" text NOT NULL DEFAULT '';
