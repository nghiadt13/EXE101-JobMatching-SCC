-- CreateEnum
CREATE TYPE "RecommendationScanStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "RecommendationScan" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "status" "RecommendationScanStatus" NOT NULL DEFAULT 'PROCESSING',
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "preFiltered" INTEGER NOT NULL DEFAULT 0,
    "aiEvaluated" INTEGER NOT NULL DEFAULT 0,
    "processingMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RecommendationScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationResult" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "matchTier" TEXT NOT NULL,
    "matchingVersion" TEXT NOT NULL,
    "matchingSnapshot" JSONB,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "gaps" JSONB NOT NULL DEFAULT '[]',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecommendationScan_candidateId_createdAt_idx" ON "RecommendationScan"("candidateId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RecommendationScan_status_idx" ON "RecommendationScan"("status");

-- CreateIndex
CREATE INDEX "RecommendationResult_scanId_rank_idx" ON "RecommendationResult"("scanId", "rank");

-- CreateIndex
CREATE INDEX "RecommendationResult_jobId_idx" ON "RecommendationResult"("jobId");

-- AddForeignKey
ALTER TABLE "RecommendationScan" ADD CONSTRAINT "RecommendationScan_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationResult" ADD CONSTRAINT "RecommendationResult_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "RecommendationScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationResult" ADD CONSTRAINT "RecommendationResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
