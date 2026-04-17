-- Add numeric priority score with 1-5 range semantic
ALTER TABLE "Wishlist" ADD COLUMN "priorityScore" INTEGER NOT NULL DEFAULT 3;

-- Backfill from previous enum values
UPDATE "Wishlist"
SET "priorityScore" = CASE "priority"
  WHEN 'HIGH' THEN 5
  WHEN 'MEDIUM' THEN 3
  WHEN 'LOW' THEN 1
  ELSE 3
END;

-- Replace old enum priority with numeric score
ALTER TABLE "Wishlist" DROP COLUMN "priority";

DROP TYPE IF EXISTS "WishlistPriority";

DROP INDEX IF EXISTS "Wishlist_userId_priority_createdAt_idx";
CREATE INDEX "Wishlist_userId_priorityScore_createdAt_idx" ON "Wishlist"("userId", "priorityScore", "createdAt");
