# Phase 5: Tests, Rollout Checks, And Docs Sync

## Context Links

- [Plan Overview](./plan.md)
- [Jobs Service Spec](../../apps/api/src/jobs/jobs.service.spec.ts)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)
- [API Endpoints Doc](../../docs/03-api-endpoints.md)
- [Implementation Checklist](../../docs/05-implementation-checklist.md)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 3h  
**Completed:** 2026-03-07

Close the loop with tests, compatibility checks, and doc updates so JD upload ships without regressing existing job and matching flows.

## Key Insights

- The highest-value regression check is matching compatibility, because current matching reads JD normalization from `location.__normalization`.
- Upload validation and cleanup paths are easy to miss without explicit tests.
- Docs only need focused updates for endpoint and recruiter workflow changes.

## Requirements

### Functional

- Add backend tests for upload validation, parse fallback, and cleanup behavior.
- Add frontend/client coverage where it provides confidence for upload flow wiring.
- Update API/workflow docs for new recruiter JD upload path.

### Non-Functional

- Keep tests focused on touched areas.
- Avoid expanding docs into speculative future features.
- Confirm builds/lint still pass for modified apps.

## Architecture

```text
Test pyramid
  -> service/unit tests for Jobs upload path
  -> integration checks for response contract
  -> matching compatibility assertion on normalizedProfile path
```

## Related Code Files

### Files To Modify

- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/api/test/*` if endpoint-level coverage is needed
- `apps/web/lib/jobs-client.ts` tests if present in repo patterns
- `docs/03-api-endpoints.md`
- `docs/05-implementation-checklist.md`

### Files To Create

- New test files only if the existing suite has no suitable home.

### Files To Delete

- None.

## Implementation Steps

1. Add unit/service coverage for recruiter JD upload success path.
2. Add failure-path coverage for unsupported file, unreadable file, fallback parse, and file cleanup on DB error.
3. Assert returned Job payload still exposes `normalizedProfile`, `parseStatus`, and `parseTelemetry` in the existing shape.
4. Assert matching can still read uploaded-JD normalized data through the current location metadata path.
5. Update API endpoint docs and recruiter flow checklist items.
6. Run lint/tests/build for touched apps.

## Todo List

- [x] Upload path backend tests added.
- [x] Matching compatibility assertions added.
- [x] Docs updated for new endpoint/workflow.
- [x] Lint/tests/build commands identified and run during implementation.

## Success Criteria

- JD upload feature is covered enough to refactor safely.
- Matching contract remains backward-compatible.
- Docs reflect the real recruiter flow, not an idealized one.

## Risk Assessment

- **Risk:** Tests only cover happy path and miss cleanup/regression cases.
- **Mitigation:** Make failure-path coverage mandatory for this feature.

- **Risk:** Docs drift from actual endpoint names or UI copy.
- **Mitigation:** Update docs after implementation shape is finalized, not before.

## Security Considerations

- Test authorization failures for non-recruiter actors.
- Ensure error responses do not leak internal paths or parser internals.

## Next Steps

- After implementation, review whether provenance-in-location is still acceptable or should graduate to first-class Job fields.

## Unresolved Questions

- None.