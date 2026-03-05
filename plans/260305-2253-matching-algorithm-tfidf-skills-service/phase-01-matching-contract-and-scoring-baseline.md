# Phase 1: Matching Contract And Scoring Baseline

## Context Links

- [Plan Overview](./plan.md)
- [Docs: Matching Algorithm](../../docs/04-matching-algorithm.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)
- [Schema](../../apps/api/prisma/schema.prisma)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 1.5h

Lock contract, formulas, and score boundaries before implementing matching module.

## Key Insights

- `natural` is already installed in API dependencies.
- `CV` data already stores `skills` and `parsedData.summary/contact/experience`.
- `Job` data already stores `description` and `skills`.
- Applications table already has `matchScore`, `tfidfScore`, `skillsScore` fields for later integration.

## Requirements

### Functional

- Define `POST /matching/calculate` contract:
  - Request: `{ cvId, jobId }`
  - Response:
    - `score` (`0-100`)
    - `tfidfScore` (`0-1`)
    - `skillsScore` (`0-1`)
    - `breakdown.matchedSkills`
    - `breakdown.missingSkills`
- Freeze formula:
  - `final = tfidfScore * 0.7 + skillsScore * 0.3`
- Define normalization:
  - lowercase skill matching
  - trim/whitespace normalization for text
  - dedupe skills

### Non-functional

- Deterministic output for same inputs.
- Error codes clear for invalid/missing CV or Job (`400`/`404`).
- Contract must stay compatible with upcoming applications flow.

## Architecture

```text
MatchingController
  -> MatchingService
     -> CV/Job data loader
     -> Score calculators (tfidf + skills + combine)
```

## Related Code Files

### Files To Modify

- `docs/03-api-endpoints.md`
- `docs/05-implementation-checklist.md`

### Files To Create

- None (contract phase).

### Files To Delete

- None.

## Implementation Steps

1. Finalize request/response DTO and scoring formula.
2. Define boundary behaviors:
   - empty text -> TF-IDF = 0
   - empty job skills -> skills score = 0
3. Define output rounding and score clamping rules.
4. Update docs for endpoint and score semantics.

## Todo List

- [x] Contract finalized.
- [x] Formula and normalization rules finalized.
- [x] Edge-case behavior matrix finalized.

## Success Criteria

- [x] No ambiguity for phase 2-3 implementation.
- [x] API contract stable for integration into applications.

## Risk Assessment

- **Risk:** unclear edge-case rules cause flaky tests.
- **Mitigation:** write explicit boundary definitions in this phase.

## Security Considerations

- Do not leak full raw CV text in response.
- Treat parsed text as untrusted input and sanitize before tokenization.

## Next Steps

- Build pure calculator services and deterministic scoring functions.

## Unresolved Questions

- None.
