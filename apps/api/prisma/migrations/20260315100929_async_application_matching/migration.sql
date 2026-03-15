-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'PENDING_MATCHING';

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "matchScore" SET DEFAULT 0;
