ALTER TABLE "CV"
ADD COLUMN "candidateProfile" JSONB,
ADD COLUMN "candidateProfileVersion" TEXT;

ALTER TABLE "Job"
ADD COLUMN "requirementsSchema" JSONB,
ADD COLUMN "requirementsSchemaVersion" TEXT;