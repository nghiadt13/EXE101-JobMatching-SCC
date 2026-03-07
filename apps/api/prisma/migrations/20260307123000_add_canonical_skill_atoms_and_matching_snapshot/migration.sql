ALTER TABLE "CV"
ADD COLUMN "skillAtoms" JSONB;

ALTER TABLE "Job"
ADD COLUMN "skillAtoms" JSONB;

ALTER TABLE "Application"
ADD COLUMN "matchingSnapshot" JSONB;