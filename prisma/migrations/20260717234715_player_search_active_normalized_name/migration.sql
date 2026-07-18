-- AlterTable: add normalizedName as nullable first so existing rows can be backfilled before
-- the NOT NULL constraint is applied (the table already has real crosswalked player data).
ALTER TABLE "Player" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "normalizedName" TEXT;

-- Backfill: lowercased, apostrophe-stripped copy of the existing name.
UPDATE "Player" SET "normalizedName" = LOWER(REPLACE(name, '''', ''));

-- Now that every row has a value, enforce NOT NULL.
ALTER TABLE "Player" ALTER COLUMN "normalizedName" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Player_normalizedName_idx" ON "Player"("normalizedName");
