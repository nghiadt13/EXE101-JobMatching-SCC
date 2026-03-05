# Phase 5: Testing, Performance Checks, And Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-calculator-core-tfidf-skills-final-score.md)
- [Phase 3](./phase-03-matching-api-endpoint-and-data-loading.md)
- [Phase 4](./phase-04-integration-prep-for-applications-flow.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2.5h

Validate score correctness, boundary handling, and baseline runtime for matching endpoint/service.

## Key Insights

- Matching logic is math-heavy; unit tests are mandatory to prevent silent regressions.
- Endpoint correctness depends on CV/job visibility rules in addition to formula logic.
- Performance target from docs is lightweight and achievable for single-request matching.

## Requirements

### Functional

- Add calculator unit tests:
  - TF-IDF output bounds
  - skills overlap scenarios
  - weighted formula correctness
  - breakdown matched/missing skills
- Add matching service tests:
  - missing CV/job
  - non-visible resource access
  - valid score output contract
- Extend API e2e:
  - authorized calculation success
  - invalid payload rejected
  - forbidden/404 visibility cases

### Non-functional

- API commands pass:
  - `lint`
  - `test`
  - `test:e2e`
  - `build`
- Basic perf check:
  - N runs average for single request (document result)

## Architecture

```text
Unit tests -> pure calculators
Service tests -> access + mapping
E2E tests -> endpoint contract + auth guards
Perf check -> lightweight local benchmark script/test
```

## Related Code Files

### Files To Modify

- `apps/api/test/app.e2e-spec.ts`
- `docs/05-implementation-checklist.md`

### Files To Create

- `apps/api/src/matching/matching.service.spec.ts`
- `apps/api/src/matching/calculators/tfidf-calculator.service.spec.ts`
- `apps/api/src/matching/calculators/skills-calculator.service.spec.ts`
- `apps/api/src/matching/calculators/score-combiner.service.spec.ts`
- `apps/api/src/matching/docs/matching-performance-notes.md`

### Files To Delete

- None.

## Implementation Steps

1. Add calculator-focused unit tests.
2. Add matching service tests for access and edge cases.
3. Extend e2e tests for `/matching/calculate`.
4. Run API validation commands and fix regressions.
5. Record basic performance observations in notes doc.

## Todo List

- [x] Calculator tests added.
- [x] Matching service tests added.
- [x] Matching e2e tests added.
- [x] API lint/test/e2e/build passing.
- [x] Performance notes documented.

## Success Criteria

- [x] Matching formula correctness verified by tests.
- [x] Endpoint contract stable and guarded.
- [x] Baseline runtime acceptable for MVP usage.

## Risk Assessment

- **Risk:** TF-IDF numerical variance causes brittle assertions.
- **Mitigation:** assert bounded ranges/tolerance, not overly exact decimals.

## Security Considerations

- Ensure endpoint does not reveal sensitive text payloads.
- Validate actor visibility checks through negative tests.

## Next Steps

- Continue with applications flow plan (Day 12) using matching service integration.

## Unresolved Questions

- None.
