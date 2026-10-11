-- Pro access becomes one of two paid tiers, so the expiry column is no longer
-- Pro-specific. Renamed (not dropped and re-added) to keep existing values.
ALTER TABLE "User" RENAME COLUMN "proUntil" TO "paidUntil";
ALTER TABLE "User" ADD COLUMN "paidPlan" TEXT;
UPDATE "User" SET "paidPlan" = 'pro' WHERE "paidUntil" IS NOT NULL;

ALTER TABLE "Payment" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'pro';
ALTER TABLE "Payment" ALTER COLUMN "plan" DROP DEFAULT;
