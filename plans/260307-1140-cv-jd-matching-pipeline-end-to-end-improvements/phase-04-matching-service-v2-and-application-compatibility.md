# Phase 4: Matching Service V2 And Application Compatibility

## Context Links

- [Plan Overview](./plan.md)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)
- [Skills Calculator](../../apps/api/src/matching/calculators/skills-calculator.service.ts)
- [Applications Service](../../apps/api/src/applications/applications.service.ts)
- [Applications Types](../../apps/api/src/applications/applications.types.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 8h

Introduce a v2 matching path that reads canonical skills, preserves current application creation behavior, and emits a richer but additive explanation model. This phase is the compatibility core and should not run in parallel with schema changes.

## Key Insights

- Current skills score is exact set overlap against normalized strings only.
- Current application flow depends on `calculateIntegrationPayload` and persists only three numeric fields.
- Non-breaking rollout needs a compatibility adapter that still returns current payload fields while adding explanation metadata.

## Requirements

### Functional

- Read `skillAtoms` first, fallback to legacy `skills` arrays.
- Keep current 70/30 TF-IDF + skills formula until calibration proves a change is justified.
- Produce explanation payload with matched skills, missing skills, canonical matches, and low-confidence warnings.
- Keep `POST /applications` behavior intact.

### Non-Functional

- One calculator path per version. Avoid branching logic spread across controllers and services.
- Deterministic output for the same inputs.
- Support feature-flag rollback to legacy matching.

## Architecture

```text
matching facade
  -> choose legacy or v2 by flag
  -> load CV/Job canonical skills if present
  -> compute tfidf component
  -> compute skills overlap on canonical keys
  -> build explanation snapshot
  -> return legacy numeric fields + additive explanation fields
```

## Related Code Files

### Files To Modify

- `apps/api/src/matching/matching.service.ts`
- `apps/api/src/matching/matching.types.ts`
- `apps/api/src/matching/calculators/skills-calculator.service.ts`
- `apps/api/src/matching/calculators/score-combiner.service.ts`
- `apps/api/src/applications/applications.service.ts`
- `apps/api/src/applications/applications.types.ts`
- `apps/api/src/applications/applications.service.spec.ts`

### Files To Create

- `apps/api/src/matching/services/matching-v2.service.ts`
- `apps/api/src/matching/services/matching-explanation-builder.service.ts`
- `apps/api/src/matching/services/matching-version-router.service.ts`

### Files To Delete

- None.

## Implementation Steps

1. Introduce matching version router so controllers and applications service call one stable facade.
2. Keep legacy formula weights in v2 for first release. Fix the input quality problem before changing weights.
3. Update skills calculator to compare canonical keys from `skillAtoms`.
4. Expand breakdown to include:
   - matched display labels
   - missing job labels
   - matched canonical keys
   - source warnings such as low parse confidence or legacy fallback usage
5. Extend `calculateIntegrationPayload` to return additive fields while preserving:
   - `finalScorePercent`
   - `tfidfScore`
   - `skillsScore`
6. Persist `matchingSnapshot` on application create so recruiter review sees a stable explanation.
7. Add compatibility tests:
   - legacy path unchanged
   - v2 path fixes grouped-skill bug
   - mixed-shape CV/Job rows still work

## Todo List

- [ ] Matching facade and version router added.
- [ ] Canonical skill comparison live in v2.
- [ ] Application create stores additive snapshot.
- [ ] Existing scalar response fields preserved.
- [ ] Compatibility and regression tests added.

## Success Criteria

- The verified grouped-skill sample no longer returns `skillsScore=0` when skills clearly overlap.
- Application creation still succeeds without requiring frontend changes on day one.
- Rollback to legacy matching is one config change, not a code revert.

## Risk Assessment

- **Risk:** Simultaneously changing formula and inputs obscures root-cause validation.
- **Mitigation:** Keep formula stable in the first v2 release.

- **Risk:** Snapshot payload grows too large for list endpoints.
- **Mitigation:** Store full snapshot, return summarized fields in list endpoints.

## Security Considerations

- Explanation payloads exposed to recruiters must exclude private raw CV text or hidden normalization internals.

## Next Steps

- Build recruiter-side ranking and review surfaces on top of the stable v2 payload.

## Unresolved Questions

- Whether to compute ranking from live re-evaluation or persisted application snapshot in recruiter list views.