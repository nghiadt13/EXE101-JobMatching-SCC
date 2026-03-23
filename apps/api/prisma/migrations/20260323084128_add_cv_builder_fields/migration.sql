-- AlterTable
ALTER TABLE "CV" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'upload',
ADD COLUMN     "templateId" TEXT NOT NULL DEFAULT 'simple';
