# Phase 5: Ranking, Explainability, And Recruiter Review Readiness

## Context Links

- [Plan Overview](./plan.md)
- [Applications Service](../../apps/api/src/applications/applications.service.ts)
- [Applications Client](../../apps/web/lib/applications-client.ts)
- [Recruiter Applications Table](../../apps/web/components/applications/recruiter-applications-table.tsx)
- [Release Acceptance Matrix](../../docs/06-release-readiness-acceptance-matrix.md)

## Overview

**Priority:** P1  
**Status:** Pending  
**Estimate:** 6h

Turn raw scores into a recruiter-usable ranking surface. This phase is not about more scoring complexity; it is about making the improved score sortable, explainable, and safe for human review.

## Key Insights

- Current recruiter UI shows only candidate name, job title, status, and a rounded score.
- Ranking quality will not be trusted unless recruiters can understand why a candidate is high or low.
- Low-confidence parsing should surface as warnings, not silently blend into ranking.

## Requirements

### Functional

- Recruiter list sorts by score in a stable and documented order.
- List/detail payload includes explanation summary.
- Recruiter can see matched skills, missing skills, and confidence warnings.
- Ranking endpoint is ready for future filters without redesign.

### Non-Functional

- Keep the first ranking rule deterministic and simple.
- Avoid building a separate search system in this phase.
- Ensure list payload remains lightweight enough for dashboard views.

## Architecture

```text
application record
  -> score + matchingSnapshot summary
  -> recruiter list query
  -> stable ranking order
  -> review table and detail drawer/page
```

## Related Code Files

### Files To Modify

- `apps/api/src/applications/applications.service.ts`
- `apps/api/src/applications/applications.types.ts`
- `apps/web/lib/applications-client.ts`
- `apps/web/components/applications/recruiter-applications-table.tsx`
- recruiter dashboard application page(s)

### Files To Create

- `apps/web/components/applications/match-explanation-panel.tsx`
- `apps/api/src/applications/dto/query-ranked-applications.dto.ts` if ranking options are separated cleanly

### Files To Delete

- None.

## Implementation Steps

1. Define default recruiter ranking order:
   - primary: `matchScore` descending
   - secondary: `skillsScore` descending
   - tertiary: `appliedAt` ascending or descending, but document one rule and keep it consistent
2. Add list response summary fields sourced from `matchingSnapshot`:
   - `matchedSkillsTop`
   - `missingSkillsTop`
   - `confidenceLabel`
   - `warningFlags`
3. Add recruiter detail panel with component breakdown and a short explanation sentence.
4. Surface low-confidence parse states clearly, for example `Review source data` when CV or JD parsing is degraded.
5. Keep candidate-facing views unchanged unless there is a clear UX need.
6. Add smoke criteria for recruiter review workflows:
   - obvious overlap candidates rise above zero-overlap false negatives
   - explanation panel matches persisted snapshot
   - low-confidence rows are visibly flagged

## Todo List

- [ ] Ranking order finalized and documented.
- [ ] Recruiter list payload extended with summary fields.
- [ ] Explanation panel implemented.
- [ ] Confidence warnings visible in recruiter review UI.
- [ ] Smoke checklist updated.

## Success Criteria

- Recruiters can sort and review candidates without needing raw TF-IDF internals.
- Explanation summaries are consistent with the stored matching snapshot.
- Low-confidence rows are visible and do not look equally trustworthy.

## Risk Assessment

- **Risk:** Too much detail in the table makes review slower.
- **Mitigation:** Keep details collapsible and summaries short.

- **Risk:** List sorting uses frozen scores while recruiters expect live recalculation.
- **Mitigation:** Explicitly label the snapshot timestamp or version if that distinction matters.

## Security Considerations

- Do not surface private candidate content beyond fields already intended for recruiter review.

## Next Steps

- Validate the new ranking behavior against a real regression set and define quality thresholds.

## Unresolved Questions

- Whether recruiter-side manual override tags should ship now or wait until a later feedback loop phase.