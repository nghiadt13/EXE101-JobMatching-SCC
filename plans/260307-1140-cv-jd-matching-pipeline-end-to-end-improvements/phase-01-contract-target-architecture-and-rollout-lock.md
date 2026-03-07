# Phase 1: Contract, Target Architecture, And Rollout Lock

## Context Links

- [Plan Overview](./plan.md)
- [Existing Matching Plan](../260305-2253-matching-algorithm-tfidf-skills-service/plan.md)
- [Matching Algorithm Doc](../../docs/04-matching-algorithm.md)
- [Schema](../../apps/api/prisma/schema.prisma)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)
- [AI Normalization Service](../../apps/api/src/normalization/ai-normalization.service.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 4h

Lock the data contract before changing extraction logic. This phase decides the canonical storage model, the UI display model, rollout flags, and the non-breaking API boundary for application creation and recruiter review.

## Key Insights

- Current prompt explicitly asks Gemini to group granular skills under category strings, which creates the verified overlap failure.
- Current API and web flows assume `skills: string[]` and application records only persist `matchScore`, `tfidfScore`, and `skillsScore`.
- The least risky path is additive: introduce canonical atomic skills while keeping current friendly arrays available during rollout.

## Requirements

### Functional

- Define atomic skill unit for both CV and JD.
- Define canonical storage model vs display model.
- Define matching version and rollout flag strategy.
- Define recruiter-facing explanation summary contract.

### Non-Functional

- No breaking change to current apply flow in first rollout.
- Keep KISS: avoid full ontology service or cross-table joins unless the current bug demands it.
- Ensure junior developers can implement by following one source-of-truth contract.

## Architecture

```text
raw text or manual form
  -> normalization pipeline
  -> skill group splitter
  -> atomic skill records
  -> canonicalized skill records
  -> persisted canonical source
  -> display adapter produces string[] for existing endpoints
  -> matching v2 reads canonical source first, legacy strings second
```

## Related Code Files

### Files To Modify

- `apps/api/prisma/schema.prisma`
- `apps/api/src/normalization/normalization.types.ts`
- `apps/api/src/matching/matching.types.ts`
- `apps/api/src/applications/applications.types.ts`
- `apps/web/lib/applications-client.ts`

### Files To Create

- `apps/api/src/matching/types/skill-canonical.types.ts`
- `apps/api/src/matching/docs/matching-v2-rollout-notes.md`

### Files To Delete

- None.

## Implementation Steps

1. Define atomic skill record shape. Recommended MVP shape:
   - `raw`: original substring.
   - `label`: cleaned atomic label for display.
   - `canonical`: normalized comparison key.
   - `group`: optional parent category from source text.
   - `source`: `cv_parsed | cv_manual | job_parsed | job_manual`.
2. Decide persistence strategy:
   - Add `skillAtoms` JSON column on both `CV` and `Job` as canonical source.
   - Keep current `skills` JSON array as display-friendly compatibility field during rollout.
3. Define display rule:
   - Web forms and current APIs can continue to send and receive `skills: string[]`.
   - Server owns conversion from display strings to atomic canonical records.
4. Define matching version flag:
   - `MATCHING_VERSION=legacy|v2`
   - optional DB field `matchingVersion` for persisted snapshots.
5. Define explanation summary contract returned to recruiter lists and detail views:
   - component scores
   - top matched skills
   - missing required skills
   - parse-confidence warnings
6. Lock fallback rule: if `skillAtoms` are missing, matching v2 can derive from legacy `skills` arrays until backfill completion.

## Todo List

- [ ] Canonical skill record shape approved.
- [ ] CV and Job persistence rule approved.
- [ ] Compatibility adapter contract approved.
- [ ] Rollout flag and fallback behavior approved.
- [ ] Recruiter explanation summary shape approved.

## Success Criteria

- Team has one stable target contract for all later phases.
- No ambiguity remains about which field is canonical and which field is display-only.

## Risk Assessment

- **Risk:** Too-rich skill schema slows implementation and backfill.
- **Mitigation:** Keep MVP record minimal and JSON-based.

- **Risk:** UI starts mutating canonical-only structures directly.
- **Mitigation:** Keep UI on `skills: string[]` in first rollout.

## Security Considerations

- Do not expose internal canonical keys or provenance that leaks file-processing internals unless needed for recruiter review.
- Feature flags must not bypass existing authorization on jobs, CVs, or applications.

## Next Steps

- Build deterministic atomic extraction and canonicalization utilities against the locked contract.

## Unresolved Questions

- Whether `matchingVersion` belongs on `Application` only or also on `CV` and `Job` snapshots.