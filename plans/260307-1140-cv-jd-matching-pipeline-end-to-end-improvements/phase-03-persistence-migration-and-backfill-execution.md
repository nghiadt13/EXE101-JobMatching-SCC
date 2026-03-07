# Phase 3: Persistence, Migration, And Backfill Execution

## Context Links

- [Plan Overview](./plan.md)
- [Schema](../../apps/api/prisma/schema.prisma)
- [Seed](../../apps/api/prisma/seed.ts)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 7h

Introduce additive schema changes, migrate existing rows safely, and backfill canonical skills without forcing downtime or breaking reads during partial completion.

## Key Insights

- `CV.skills` and `Job.skills` are currently JSON arrays and are not enough to carry canonical vs display distinctions.
- Backfill must handle mixed data quality because existing rows include grouped strings, manual edits, and fallback parser output.
- Existing read paths should remain functional even while backfill is in progress.

## Requirements

### Functional

- Add canonical persistence fields for CV and Job.
- Add application snapshot fields needed for stable recruiter review.
- Backfill all active CV and Job rows.
- Track progress, failures, and retryability.

### Non-Functional

- Migration must be additive first.
- Backfill must be resumable and idempotent.
- Reads must support mixed old/new rows until completion.

## Architecture

```text
prisma migration
  -> deploy additive columns
  -> application reads support legacy + canonical fallback
  -> batch backfill active CV rows
  -> batch backfill active Job rows
  -> verify counts and sampled outputs
  -> optionally recalculate selected applications
```

## Related Code Files

### Files To Modify

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/applications/applications.service.ts`

### Files To Create

- `apps/api/prisma/migrations/*`
- `apps/api/scripts/backfill-canonical-skills.ts`
- `apps/api/scripts/recalculate-application-matching-snapshot.ts`
- `apps/api/src/matching/services/skill-storage-adapter.service.ts`

### Files To Delete

- None.

## Implementation Steps

1. Add `skillAtoms Json?` to `CV` and `Job`.
2. Add stable recruiter-review snapshot field on `Application`. Recommended MVP field:
   - `matchingSnapshot Json?`
   - contains version, component scores, top matched skills, missing skills, warnings.
3. Keep old scalar fields (`matchScore`, `tfidfScore`, `skillsScore`) unchanged for compatibility.
4. Update read/write services so new writes populate both legacy and canonical fields.
5. Implement resumable backfill script:
   - scope to non-deleted CV and Job rows
   - derive `skillAtoms` from existing `skill` arrays and normalized profiles
   - dry-run mode prints counts and sample diffs
   - write mode updates in pages
   - emit success/failure summary
6. Add sampling checklist:
   - rows with grouped categories
   - rows with manual edits
   - rows with fallback normalization
7. Decide application recalculation policy:
   - do not rewrite historical `matchScore` by default
   - allow opt-in snapshot refresh for demo/test data or recruiter ranking views

## Todo List

- [ ] Prisma fields added with additive migration.
- [ ] Services can read mixed-shape rows.
- [ ] Backfill script supports dry-run and resume.
- [ ] Seed data updated to include grouped-skill cases and canonical fields.
- [ ] Verification checklist defined.

## Success Criteria

- New writes populate canonical fields immediately.
- Backfill completes without blocking reads or corrupting existing display arrays.
- Mixed-shape environment remains stable until rollout completes.

## Risk Assessment

- **Risk:** Backfill updates too many rows in one transaction and causes lock pressure.
- **Mitigation:** Use paged updates with bounded batch size.

- **Risk:** Historical scores become inconsistent with newly canonicalized skills.
- **Mitigation:** Freeze old application scalar scores unless explicit recalculation is requested.

## Security Considerations

- Backfill scripts must honor soft deletes and avoid touching inaccessible historical rows unnecessarily.
- Operational scripts should log counts and IDs, not raw personal document content.

## Next Steps

- Upgrade matching to consume canonical fields first and emit richer explanation payloads.

## Unresolved Questions

- Whether recruiter ranking should show recalculated live scores or application-time frozen scores by default.