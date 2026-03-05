# Phase 5: Testing And Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-cv-module-and-file-storage-flow.md)
- [Phase 3](./phase-03-parsing-pipeline-pdf-docx-gemini-normalization.md)
- [Phase 4](./phase-04-web-candidate-cv-pages-and-actions.md)
- [Docs: Implementation Checklist](../../docs/05-implementation-checklist.md)

## Overview

**Priority:** P1  
**Status:** 🔄 In Progress  
**Estimate:** 2h

Verify CV flow behavior, security boundaries, and regressions through automated checks plus smoke checklist.

## Key Insights

- API project already has unit and e2e infrastructure in place.
- Web currently relies on lint/build + manual smoke for feature validation.
- CV flow has multi-layer risk: upload validation, parser reliability, ownership, primary invariants.

## Requirements

### Functional

- Add API unit tests for CV service core rules:
  - ownership enforcement
  - set-primary invariant
  - delete fallback primary logic
- Add parser service tests for PDF/DOCX + normalization fallback behavior.
- Add API e2e tests for `/cvs` endpoints:
  - candidate can upload/list/update/delete/set-primary
  - recruiter/admin forbidden
  - invalid file type/size rejected
- Add web smoke checklist for candidate CV UX.

### Non-functional

- Touched apps must pass lint/build.
- API unit + e2e suites must pass.
- No sensitive data leakage in errors/logs.

## Architecture

```text
Unit tests -> service invariants + parser behavior
E2E tests -> auth/role/upload/status-code correctness
Web smoke -> end-user candidate CV flow verification
```

## Related Code Files

### Files To Modify

- `apps/api/test/app.e2e-spec.ts`
- `apps/web/docs/user-management-smoke-checklist.md` (cross-link if needed)
- `docs/05-implementation-checklist.md`

### Files To Create

- `apps/api/src/cvs/cvs.service.spec.ts`
- `apps/api/src/cvs/services/cv-parsing-normalizer.service.spec.ts`
- `apps/api/test/fixtures/cv/sample-cv.pdf`
- `apps/api/test/fixtures/cv/sample-cv.docx`
- `apps/web/docs/cv-management-smoke-checklist.md`

### Files To Delete

- None.

## Implementation Steps

1. Add unit tests for CV service ownership/primary/delete rules.
2. Add parser normalization tests including fallback scenarios.
3. Add e2e tests for candidate positive flow and non-candidate negative flow.
4. Add e2e tests for invalid mime and oversize rejection.
5. Run validation commands:
   - API: `lint`, `test`, `test:e2e`, `build`
   - Web: `lint`, `build`
6. Write and execute manual smoke checklist for candidate CV flow.

## Todo List

- [ ] CV unit tests added.
- [ ] Parser unit tests added.
- [ ] CV e2e tests added.
- [ ] API lint/test/e2e/build passing.
- [ ] Web lint/build passing.
- [ ] CV smoke checklist completed.

## Success Criteria

- [ ] CV feature acceptance criteria all pass.
- [ ] Security boundaries verified by tests.
- [ ] No critical regressions in auth/profile/dashboard flows.

## Risk Assessment

- **Risk:** File-based e2e fixtures become flaky across environments.
- **Mitigation:** Keep fixtures small/stable and assert deterministic outcomes.

- **Risk:** External AI behavior makes tests unstable.
- **Mitigation:** Test normalization logic deterministically and isolate AI integration checks.

## Security Considerations

- Validate forbidden access paths (`403`) for non-candidate roles.
- Ensure upload rejection paths do not leak filesystem internals.
- Confirm deleted CV records are not exposed in active list responses.

## Next Steps

- Start implementation with `ck:cook --auto` on this plan file.

## Unresolved Questions

- None.
