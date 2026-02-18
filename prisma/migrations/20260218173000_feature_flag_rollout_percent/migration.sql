ALTER TABLE "FeatureFlag"
ADD COLUMN IF NOT EXISTS "rolloutPercent" INTEGER NOT NULL DEFAULT 100;

UPDATE "FeatureFlag"
SET "rolloutPercent" = 100
WHERE "rolloutPercent" IS NULL;
