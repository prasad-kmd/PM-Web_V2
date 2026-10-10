ALTER TABLE "rate_limit" ADD COLUMN "id" text;--> statement-breakpoint
UPDATE "rate_limit"
SET "id" = gen_random_uuid()::text
WHERE "id" IS NULL;--> statement-breakpoint
ALTER TABLE "rate_limit" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rate_limit" ADD CONSTRAINT "rate_limit_id_unique" UNIQUE("id");
