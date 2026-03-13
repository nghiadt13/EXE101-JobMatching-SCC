# Phase 2: Schema and Migration Foundation

Status: Proposed

## Goal

Add minimal schema required for dynamic homepage data without breaking existing flows.

## Tasks

1. Translate SQL draft into Prisma schema updates:
   - `Company`
   - `JobCategory`
   - `SavedJob`
   - `HomepageContent`
   - `MarketStatDaily`
   - `IndustryDemandDaily`
   - optional `Notification`
2. Extend `Job` model with nullable references:
   - `companyId`
   - `categoryId`
   - `shortDescription`
3. Generate migration and verify:
   - forward migration works on clean DB
   - backward rollback script documented
4. Prepare seed/backfill strategy:
   - create baseline homepage content row
   - backfill category/company from existing jobs where possible
   - initialize snapshot tables with safe defaults
5. Add indexes for homepage query paths.

## Deliverables

- Prisma schema update.
- SQL migration files.
- Backfill/seed scripts for homepage baseline data.

## Exit Criteria

- Migration passes on local and CI database environments.
- Existing endpoints (`/jobs`, `/applications`, `/dashboard`) still pass smoke checks.

