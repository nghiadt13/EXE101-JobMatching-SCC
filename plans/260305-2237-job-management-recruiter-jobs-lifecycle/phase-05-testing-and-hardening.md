# Phase 5: Testing And Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-jobs-crud-and-scoped-listing.md)
- [Phase 3](./phase-03-api-lifecycle-transitions-and-slug-hardening.md)
- [Phase 4](./phase-04-web-recruiter-job-pages-and-public-job-browsing.md)

## Overview

**Priority:** P1  
**Status:** 🔄 In Progress  
**Estimate:** 2h

Validate jobs behavior, transition guards, and visibility boundaries with tests and smoke checklist.

## Key Insights

- API already has unit + e2e test infrastructure.
- Web validation currently uses lint/build + manual smoke checklist.
- Transition rules and visibility scoping are the highest regression risks.

## Requirements

### Functional

- Add API unit tests:
  - slug generation conflict behavior
  - transition guard rules
  - owner-only update/delete checks
- Add API e2e tests:
  - recruiter can CRUD own jobs
  - recruiter cannot mutate others' jobs
  - candidate/public get only `PUBLISHED` jobs
  - invalid transitions return `400`
- Add web smoke checklist:
  - recruiter posting flow
  - public list/detail visibility

### Non-functional

- API: lint/test/test:e2e/build all pass.
- Web: lint/build pass.
- No sensitive data leak in error responses.

## Architecture

```text
Unit -> service invariants
E2E -> route/guard/visibility contract
Web smoke -> recruiter + public user journeys
```

## Related Code Files

### Files To Modify

- `apps/api/test/app.e2e-spec.ts`
- `docs/03-api-endpoints.md`
- `docs/05-implementation-checklist.md`

### Files To Create

- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/web/docs/job-management-smoke-checklist.md`

### Files To Delete

- None.

## Implementation Steps

1. Add unit tests for slug, ownership, and transition rules.
2. Extend e2e for jobs matrix and lifecycle routes.
3. Run API validations (`lint`, `test`, `test:e2e`, `build`).
4. Run web validations (`lint`, `build`).
5. Write/execute job-management smoke checklist.

## Todo List

- [ ] Jobs unit tests added.
- [ ] Jobs e2e tests added.
- [ ] API validations passing.
- [ ] Web validations passing.
- [ ] Manual smoke checklist completed.

## Success Criteria

- [ ] Job management acceptance criteria fully covered.
- [ ] Visibility + transition regressions prevented.

## Risk Assessment

- **Risk:** e2e mock setup grows brittle with additional modules.
- **Mitigation:** isolate fixtures/helpers and keep assertions contract-focused.

## Security Considerations

- Verify `403`/`404` behavior prevents cross-tenant resource probing.
- Ensure draft job content is never exposed publicly.

## Next Steps

- Continue with matching plan after jobs flow stabilization.

## Unresolved Questions

- None.
