# Phase 3: API Lifecycle Transitions And Slug Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-jobs-crud-and-scoped-listing.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Implement explicit lifecycle endpoints and transition guards to prevent invalid job states.

## Key Insights

- API spec requires explicit endpoints: `/jobs/:id/publish`, `/jobs/:id/close`.
- Incorrect transition logic is high-risk for downstream application/matching flow.
- Lifecycle events should manage `publishedAt`/`closedAt` consistently.

## Requirements

### Functional

- Add publish endpoint:
  - only owner recruiter
  - only from `DRAFT`
  - sets `status=PUBLISHED`, `publishedAt=now`, `closedAt=null`
- Add close endpoint:
  - only owner recruiter
  - only from `PUBLISHED`
  - sets `status=CLOSED`, `closedAt=now`
- Reject invalid transitions with `400`.
- Ensure slug remains unique and stable on title updates.

### Non-functional

- Transition behavior must be deterministic under concurrent requests.
- Return clear transition errors for UI display.

## Architecture

```text
POST /jobs/:id/publish -> transition guard -> prisma update
POST /jobs/:id/close   -> transition guard -> prisma update
```

## Related Code Files

### Files To Modify

- `apps/api/src/jobs/jobs.controller.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/services/job-slug.service.ts`

### Files To Create

- None.

### Files To Delete

- None.

## Implementation Steps

1. Add `publish` and `close` controller actions.
2. Add reusable service transition guard helper.
3. Update timestamps in transition updates (`publishedAt`, `closedAt`).
4. Harden slug update path to avoid duplicate conflicts on patch.
5. Add explicit error mapping for invalid transitions and not-owner access.

## Todo List

- [ ] Publish transition implemented.
- [ ] Close transition implemented.
- [ ] Invalid transitions rejected with `400`.
- [ ] Slug hardening completed.

## Success Criteria

- [ ] Lifecycle rules strictly enforced by API.
- [ ] Timestamps reflect transition history correctly.

## Risk Assessment

- **Risk:** stale reads cause transition conflicts.
- **Mitigation:** perform conditional update with status preconditions.

## Security Considerations

- Transition endpoints require authenticated recruiter owner.
- No state override via client-provided status payload.

## Next Steps

- Build web pages consuming CRUD + transition endpoints.

## Unresolved Questions

- None.
