# Phase 3: Matching API Endpoint And Data Loading

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-calculator-core-tfidf-skills-final-score.md)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Expose `/matching/calculate` and load CV/Job data safely to compute score response.

## Key Insights

- CV and Job modules already enforce ownership/visibility; matching should apply equivalent internal checks.
- Endpoint can stay authenticated for MVP internal use to reduce accidental exposure.
- Matching output should avoid returning entire CV/job payload.

## Requirements

### Functional

- Add matching module/controller/service:
  - `POST /matching/calculate`
  - request body: `cvId`, `jobId`
- Service responsibilities:
  - load active CV + Job records
  - extract comparable text:
    - CV summary/experience/education + skills
    - Job description + skills
  - call calculators from phase 2
  - return response contract with breakdown
- Access rules (MVP safe default):
  - require authenticated user
  - candidate can calculate with own CV + visible job
  - recruiter/admin can calculate for own/visible data as defined

### Non-functional

- Avoid N+1 queries for single calculation.
- Return `404` for non-visible/non-owned resources.
- Keep response latency within MVP target.

## Architecture

```text
MatchingController (JwtAuthGuard)
  -> MatchingService
     -> Prisma reads (CV + Job)
     -> calculators
     -> response mapper
```

## Related Code Files

### Files To Modify

- `apps/api/src/app.module.ts`

### Files To Create

- `apps/api/src/matching/matching.module.ts`
- `apps/api/src/matching/matching.controller.ts`
- `apps/api/src/matching/matching.service.ts`
- `apps/api/src/matching/dto/calculate-matching.dto.ts`

### Files To Delete

- None.

## Implementation Steps

1. Scaffold matching module/controller/service/dto.
2. Implement guarded `POST /matching/calculate`.
3. Add data loaders for CV and Job with visibility checks.
4. Build text assembly helpers from CV parsed data + Job description.
5. Compute and return score/breakdown payload.
6. Wire `MatchingModule` into `AppModule`.

## Todo List

- [x] Matching module scaffolded.
- [x] Endpoint implemented with auth + validation.
- [x] CV/job loader + visibility checks implemented.
- [x] Response mapper implemented.

## Success Criteria

- [x] Endpoint returns deterministic scoring result for valid pairs.
- [x] Unauthorized/non-visible resources are blocked.

## Risk Assessment

- **Risk:** role visibility logic drifts from jobs/cvs modules.
- **Mitigation:** centralize checks in matching service helper methods.

## Security Considerations

- Do not expose raw CV text in response.
- Ensure users cannot probe private job/cv existence through differential errors.

## Next Steps

- Prepare integration contract for upcoming applications flow.

## Unresolved Questions

- None.
