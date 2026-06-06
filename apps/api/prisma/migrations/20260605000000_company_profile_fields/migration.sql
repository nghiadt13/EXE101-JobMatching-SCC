ALTER TABLE "Company"
ADD COLUMN "website" TEXT,
ADD COLUMN "taxCode" TEXT,
ADD COLUMN "size" TEXT,
ADD COLUMN "industry" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "shortDescription" TEXT,
ADD COLUMN "description" JSONB,
ADD COLUMN "highlights" JSONB,
ADD COLUMN "priorityRank" INTEGER NOT NULL DEFAULT 1000;

CREATE INDEX "Company_priorityRank_idx" ON "Company"("priorityRank");
CREATE INDEX "Company_industry_idx" ON "Company"("industry");
