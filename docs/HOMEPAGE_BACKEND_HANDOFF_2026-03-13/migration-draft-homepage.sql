-- Draft only: homepage dynamic data support
-- Date: 2026-03-13
-- Scope: add minimum schema for /api/home payload and save-job UX.

BEGIN;

-- 1) Company metadata for homepage sections
CREATE TABLE IF NOT EXISTS "Company" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE,
  "logoUrl" TEXT,
  "iconKey" TEXT,
  "isTrusted" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Company_isTrusted_idx" ON "Company" ("isTrusted");

-- 2) Category metadata for "Explore by Category"
CREATE TABLE IF NOT EXISTS "JobCategory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "iconKey" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "JobCategory_sortOrder_idx" ON "JobCategory" ("sortOrder");

-- 3) Extend Job with homepage-friendly data
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "companyId" UUID,
  ADD COLUMN IF NOT EXISTS "categoryId" UUID,
  ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;

ALTER TABLE "Job"
  ADD CONSTRAINT "Job_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL;

ALTER TABLE "Job"
  ADD CONSTRAINT "Job_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Job_companyId_idx" ON "Job" ("companyId");
CREATE INDEX IF NOT EXISTS "Job_categoryId_idx" ON "Job" ("categoryId");

-- 4) Saved jobs (heart icon)
CREATE TABLE IF NOT EXISTS "SavedJob" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "jobId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,
  CONSTRAINT "SavedJob_userId_jobId_key" UNIQUE ("userId", "jobId")
);

CREATE INDEX IF NOT EXISTS "SavedJob_userId_idx" ON "SavedJob" ("userId");
CREATE INDEX IF NOT EXISTS "SavedJob_jobId_idx" ON "SavedJob" ("jobId");

-- 5) Homepage content CMS-like payload
CREATE TABLE IF NOT EXISTS "HomepageContent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE DEFAULT 'home-main',
  "heroHeadline" TEXT NOT NULL,
  "heroSubheadline" TEXT NOT NULL,
  "heroBackgroundImageUrl" TEXT NOT NULL,
  "popularKeywords" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "footerQuickLinks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "footerSupportLinks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "footerSocialLinks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- 6) Daily market stats snapshot
CREATE TABLE IF NOT EXISTS "MarketStatDaily" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "statDate" DATE NOT NULL UNIQUE,
  "newJobs24h" INTEGER NOT NULL DEFAULT 0,
  "activeJobs" INTEGER NOT NULL DEFAULT 0,
  "hiringCompanies" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "MarketStatDaily_statDate_idx" ON "MarketStatDaily" ("statDate" DESC);

-- 7) Daily demand by industry snapshot
CREATE TABLE IF NOT EXISTS "IndustryDemandDaily" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "statDate" DATE NOT NULL,
  "industryKey" TEXT NOT NULL,
  "industryLabel" TEXT NOT NULL,
  "demandValue" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "IndustryDemandDaily_statDate_industryKey_key" UNIQUE ("statDate", "industryKey")
);

CREATE INDEX IF NOT EXISTS "IndustryDemandDaily_statDate_idx" ON "IndustryDemandDaily" ("statDate" DESC);

-- 8) Optional notifications table for unread badge
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification" ("userId", "isRead");

COMMIT;

-- Note:
-- If your PostgreSQL does not support gen_random_uuid(), enable extension:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

