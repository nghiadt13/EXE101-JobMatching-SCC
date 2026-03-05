# Phase 4: Integration Prep For Applications Flow

## Context Links

- [Plan Overview](./plan.md)
- [Phase 3](./phase-03-matching-api-endpoint-and-data-loading.md)
- [Schema Application fields](../../apps/api/prisma/schema.prisma)
- [API Endpoints](../../docs/03-api-endpoints.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Prepare stable integration surface so applications module can reuse matching logic without duplicating formula code.

## Key Insights

- Applications flow will need score persistence in `Application.matchScore/tfidfScore/skillsScore`.
- Duplicate formula logic across matching and applications will create drift risk.
- Current endpoint can be reused, but internal service contract is better for direct integration.

## Requirements

### Functional

- Expose reusable service method:
  - `calculateForCvAndJob(cvId, jobId, actor)` returning full matching payload.
- Define integration-ready type contract for application creation:
  - `finalScorePercent`, `tfidfScore`, `skillsScore`, `breakdown`.
- Define behavior for edge cases used by apply flow:
  - no primary CV selected
  - closed/unpublished job
  - CV/job soft-deleted

### Non-functional

- Keep single source of truth for score formula.
- Keep service API simple for upcoming applications module.

## Architecture

```text
MatchingService (public endpoint + internal method)
  -> used later by ApplicationsService.apply()
```

## Related Code Files

### Files To Modify

- `apps/api/src/matching/matching.service.ts`
- `apps/api/src/matching/matching.types.ts`
- `docs/03-api-endpoints.md`

### Files To Create

- None (reuse matching module files).

### Files To Delete

- None.

## Implementation Steps

1. Extract internal reusable method in matching service.
2. Define integration type exports for applications usage.
3. Document integration assumptions for Day 12 applications plan.
4. Validate endpoint still returns same contract after refactor.

## Todo List

- [x] Internal matching service contract extracted.
- [x] Shared integration types exported.
- [x] Integration assumptions documented.

## Success Criteria

- [x] Applications module can consume matching service directly with no formula duplication.
- [x] Matching endpoint behavior unchanged.

## Risk Assessment

- **Risk:** over-engineering before applications phase.
- **Mitigation:** keep method minimal and only include required fields.

## Security Considerations

- Actor context must still be enforced when method is called internally.
- Avoid bypassing visibility checks via internal-only entry point.

## Next Steps

- Add full test suite and lightweight performance checks.

## Unresolved Questions

- None.
