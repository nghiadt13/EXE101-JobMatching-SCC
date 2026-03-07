# Phase 5: Deterministic Evaluation, Scoring, And Application Compatibility

## Context Links

- [Plan Overview](./plan.md)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)
- [Applications Service](../../apps/api/src/applications/applications.service.ts)
- [Applications Client](../../apps/web/lib/applications-client.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 7h

Replace TF-IDF + exact skill scoring with deterministic evaluation against `requirementsSchema_v1`, while keeping application creation, persisted `matchScore`, and mixed old/new application reads stable.

## Key Insights

- Root cause is not just aliasing; the old model scores the wrong abstraction.
- Final scoring should come from requirement evaluation, not text similarity.
- `ApplicationsService.create` is the cutover point that matters most.

## Requirements

### Functional

- Evaluate each job requirement against candidate profile evidence.
- Produce deterministic statuses like `met`, `partial`, `missing`, `not-applicable`.
- Generate final numeric `matchScore` from explicit weighted rules.
- Persist schema-based snapshot on new applications.

### Non-Functional

- Same inputs must always produce the same score.
- Cutover must not break existing `POST /applications` or application list pages.

## Scoring Direction

- Weight buckets, for example:
  - must-have requirements: highest
  - nice-to-have requirements: medium
  - experience/seniority fit: medium
  - location/language/education: low to medium
- Score from evaluator outputs only.
- LLM is never used in this phase.

## Related Code Files

### Files To Modify

- `apps/api/src/matching/matching.service.ts`
- `apps/api/src/matching/matching.types.ts`
- `apps/api/src/applications/applications.service.ts`
- `apps/api/src/applications/applications.types.ts`
- `apps/web/lib/applications-client.ts`
- `apps/web/components/applications/recruiter-applications-table.tsx`
- `apps/web/components/applications/candidate-applications-table.tsx`

### Files To Create

- requirement evaluator service
- deterministic score rules service
- snapshot builder for `schema_v1`

### Files To Delete Or Replace

- `apps/api/src/matching/calculators/tfidf-calculator.service.ts`
- `apps/api/src/matching/calculators/skills-calculator.service.ts`
- `apps/api/src/matching/calculators/score-combiner.service.ts`
- exact-skill breakdown logic after new scorer is fully wired

## Implementation Steps

1. Introduce a schema-based evaluation facade in `matching`.
2. Build requirement evaluators for skills, experience, education, location, and languages using deterministic rules.
3. Build final score calculator with explicit weight config and rounding rules.
4. Update `calculateIntegrationPayload` to return the new snapshot plus stable `finalScorePercent`.
5. Keep old application snapshots readable.
6. Set `tfidfScore` and `skillsScore` to deprecated compatibility values during transition or stop returning them once FE no longer requires them.
7. Delete TF-IDF/exact-skill runtime calculators after cutover validation passes.

## Todo List

- [ ] Schema evaluator introduced.
- [ ] Deterministic final scorer introduced.
- [ ] New application snapshots persist `schema_v1`.
- [ ] Old snapshots still render safely.
- [ ] Old TF-IDF/exact-skill calculators removed after cutover gate.

## Success Criteria

- New applications are scored entirely from structured requirements and candidate evidence.
- Recruiter ranking no longer depends on alias-sensitive text overlap.
- Existing application creation flow still works end to end.

## Risk Assessment

- **Risk:** Scoring rules feel arbitrary if not visible.
- **Mitigation:** persist bucket-level breakdown and recruiter-readable evidence/gaps.

- **Risk:** Old and new snapshots coexist for a period.
- **Mitigation:** versioned snapshot renderer in API and FE.

## Security Considerations

- Do not persist hidden prompt text or raw LLM output in recruiter-visible snapshots.

## Next Steps

- Clean up UI copy, types, and tables that still speak in TF-IDF/skills terminology.

## Unresolved Questions

- None.