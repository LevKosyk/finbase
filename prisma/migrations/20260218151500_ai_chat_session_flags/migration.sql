-- AlterTable
ALTER TABLE "public"."AIChatSession"
ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AIChatSession_userId_isPinned_lastUsedAt_idx" ON "public"."AIChatSession"("userId", "isPinned", "lastUsedAt");
