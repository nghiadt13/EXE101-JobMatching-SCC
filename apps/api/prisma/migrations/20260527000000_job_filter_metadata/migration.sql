-- CreateTable
ALTER TABLE "Job" ADD COLUMN "workingDayStatus" TEXT,
ADD COLUMN "experienceLevel" TEXT,
ADD COLUMN "minExperienceMonths" INTEGER,
ADD COLUMN "companyIndustryKey" TEXT,
ADD COLUMN "jobFieldKey" TEXT,
ADD COLUMN "jobLevel" TEXT,
ADD COLUMN "salesModel" TEXT,
ADD COLUMN "salaryNegotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "applicationDeadline" TIMESTAMP(3);

-- CreateTable
ALTER TABLE "Company" ADD COLUMN "companyType" TEXT DEFAULT 'normal';

-- CreateTable
CREATE TABLE "JobCategoryOnJob" (
    "jobId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCategoryOnJob_pkey" PRIMARY KEY ("jobId", "categoryId")
);

-- CreateIndex
CREATE INDEX "JobCategoryOnJob_categoryId_idx" ON "JobCategoryOnJob"("categoryId");

-- CreateTable
CREATE TABLE "JobCustomerTypeOnJob" (
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCustomerTypeOnJob_pkey" PRIMARY KEY ("jobId", "type")
);

-- CreateIndex
CREATE INDEX "JobCustomerTypeOnJob_type_idx" ON "JobCustomerTypeOnJob"("type");

-- CreateIndex
CREATE INDEX "Job_workingDayStatus_idx" ON "Job"("workingDayStatus");

-- CreateIndex
CREATE INDEX "Job_experienceLevel_idx" ON "Job"("experienceLevel");

-- CreateIndex
CREATE INDEX "Job_companyIndustryKey_idx" ON "Job"("companyIndustryKey");

-- CreateIndex
CREATE INDEX "Job_jobFieldKey_idx" ON "Job"("jobFieldKey");

-- CreateIndex
CREATE INDEX "Job_jobLevel_idx" ON "Job"("jobLevel");

-- CreateIndex
CREATE INDEX "Job_salesModel_idx" ON "Job"("salesModel");

-- CreateIndex
CREATE INDEX "Job_applicationDeadline_idx" ON "Job"("applicationDeadline");

-- CreateIndex
CREATE INDEX "Job_salaryNegotiable_idx" ON "Job"("salaryNegotiable");

-- CreateIndex
CREATE INDEX "Company_companyType_idx" ON "Company"("companyType");

-- Backfill: Migrate existing Job.categoryId to JobCategoryOnJob join table
INSERT INTO "JobCategoryOnJob" ("jobId", "categoryId", "createdAt")
SELECT "id", "categoryId", NOW()
FROM "Job"
WHERE "categoryId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill: Mark trusted companies as 'pro'
UPDATE "Company" SET "companyType" = 'pro' WHERE "isTrusted" = true;

-- Backfill: Mark jobs with no salary range as negotiable
UPDATE "Job" SET "salaryNegotiable" = true WHERE "salaryMin" IS NULL AND "salaryMax" IS NULL;
