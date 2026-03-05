# Phase 2: API Jobs CRUD And Scoped Listing

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-job-contract-and-lifecycle-matrix-baseline.md)
- [Schema](../../apps/api/prisma/schema.prisma)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 4h

Build jobs module endpoints for create/read/update/delete with ownership and visibility scoping.

## Key Insights

- Existing modules use controller/service/dto/types pattern, reusable for jobs.
- `Job.deletedAt` is available for soft delete.
- Existing e2e tests already mock auth/users/profile and can be extended for jobs.

## Requirements

### Functional

- Add `jobs` module with endpoints and DTOs:
  - create job
  - list jobs with role-aware filtering
  - get job detail with role-aware visibility
  - update job for recruiter owner
  - soft delete for recruiter owner
- Auto-generate slug from title on create/update.
- Enforce owner filter for recruiter mutable actions.
- Support job query filters:
  - `status`
  - `search` (title/description)
  - pagination

### Non-functional

- Keep response stable and safe (no internal-only fields).
- Query performance with indexed fields (`status`, `publishedAt`, `deletedAt`).

## Architecture

```text
JobsController
  -> public GET routes + guarded recruiter routes
  -> JobsService
     -> slug utility
     -> Prisma job CRUD with role-aware where clauses
```

## Related Code Files

### Files To Modify

- `apps/api/src/app.module.ts`

### Files To Create

- `apps/api/src/jobs/jobs.module.ts`
- `apps/api/src/jobs/jobs.controller.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.types.ts`
- `apps/api/src/jobs/dto/create-job.dto.ts`
- `apps/api/src/jobs/dto/update-job.dto.ts`
- `apps/api/src/jobs/dto/query-jobs.dto.ts`
- `apps/api/src/jobs/services/job-slug.service.ts`

### Files To Delete

- None.

## Implementation Steps

1. Scaffold jobs module/controller/service/dto/types.
2. Implement create endpoint with slug generation.
3. Implement role-aware list endpoint:
   - anonymous/candidate: `PUBLISHED` only
   - recruiter: own jobs, all statuses
4. Implement detail endpoint with same visibility logic.
5. Implement update + soft delete with owner checks.
6. Handle unique slug conflicts robustly (`409` mapping/retry logic).

## Todo List

- [ ] Jobs module scaffolded.
- [ ] CRUD endpoints implemented.
- [ ] Role-aware list/detail visibility implemented.
- [ ] Slug conflict handling implemented.

## Success Criteria

- [ ] Recruiter can manage only own jobs.
- [ ] Public/candidate cannot access private recruiter drafts.
- [ ] Soft delete removes jobs from active listings.

## Risk Assessment

- **Risk:** slug collision race returns unstable errors.
- **Mitigation:** retry with suffix + map unique constraint to `409`.

## Security Considerations

- Block cross-recruiter update/delete access.
- Never trust recruiterId from client payload; derive from JWT.

## Next Steps

- Add publish/close transitions with strict lifecycle guards.

## Unresolved Questions

- None.
