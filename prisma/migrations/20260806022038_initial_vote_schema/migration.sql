-- CreateEnum
CREATE TYPE "Template" AS ENUM ('WHICH_FIRST', 'SHOULD_BEFORE', 'SHOULD_AFTER');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "pairKey" TEXT NOT NULL,
    "firstShown" TEXT NOT NULL,
    "template" "Template" NOT NULL,
    "answer" TEXT NOT NULL,
    "winner" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vote_pairKey_idx" ON "Vote"("pairKey");

-- CreateIndex
CREATE INDEX "Vote_sessionId_createdAt_idx" ON "Vote"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_sessionId_pairKey_template_firstShown_key" ON "Vote"("sessionId", "pairKey", "template", "firstShown");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
