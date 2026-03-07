# Phase 3: Matching And Persistence, Remove Legacy Read Fallbacks Safely

## Context Links

- `job-matching/apps/api/src/cvs/cvs.service.ts`
- `job-matching/apps/api/src/jobs/jobs.service.ts`
- `job-matching/apps/api/src/matching/matching.service.ts`
- `job-matching/apps/api/src/matching/services/skill-storage-adapter.service.ts`
- `job-matching/docs/04-matching-algorithm.md`

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 4h  
**Completed:** 2026-03-07

Remove legacy matching fallback behavior without breaking existing data by using a release gate or one-time backfill for `skillAtoms`.

## Key Insights

- `SkillStorageAdapterService.deriveFromLegacySkills()` is the concrete fallback entry point already visible in current code.
- The docs still describe `legacy` atoms as a normal compatibility source.
- Removing normalization fallback but keeping matching fallback would leave the system inconsistent and harder to reason about.

## File Ownership

- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/cvs/cvs.service.spec.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/api/src/matching/matching.service.ts`
- `apps/api/src/matching/matching.service.spec.ts`
- `apps/api/src/matching/services/skill-storage-adapter.service.ts`
- `apps/api/src/matching/services/skill-storage-adapter.service.spec.ts`
- `apps/api/src/matching/types/skill-canonical.types.ts`

## Requirements

- New writes must always persist `skillAtoms`.
- Read-time derivation from legacy `skills` should be removed or tightly gated before release.
- Matching warnings and docs should stop describing legacy fallback as normal behavior.

## Architecture

- Write path: CV/JD create and update flows must persist both display skills and canonical `skillAtoms` on every active write.
- Read path: matching should read canonical atoms only in steady state.
- Release path: historical rows missing atoms need either backfill, reseed, or a hard block on release.

## Related Code Files

- Modify: `apps/api/src/matching/services/skill-storage-adapter.service.ts` to remove or gate legacy derivation.
- Modify: `apps/api/src/matching/matching.service.ts` and related specs.
- Modify: `apps/api/src/cvs/cvs.service.ts` and `apps/api/src/jobs/jobs.service.ts` if any update path can still save only `skills`.
- Possibly add: one operational backfill script or documented reseed path if existing data cannot be regenerated cheaply.

## Implementation Steps

1. Audit whether any create/update path can still save records without `skillAtoms`.
2. Remove or gate `deriveFromLegacySkills()` usage in matching reads.
3. Decide whether missing `skillAtoms` becomes hard failure, empty score, or blocked release condition.
4. Add release/backfill checklist for old rows.
5. Update tests that currently assert legacy fallback warnings and scores.

## Todo List

- [x] Audit every active write path for `skillAtoms` persistence.
- [x] Remove or feature-gate `deriveFromLegacySkills()` usage.
- [x] Decide operational treatment for old rows with missing atoms.
- [x] Update matching tests and docs to remove fallback expectations.

## Success Criteria

- Matching reads do not silently mask missing canonical skill data.
- Legacy compatibility is handled intentionally, not implicitly.

## Risk Assessment

- Existing seeded or historical data may fail matching until backfilled.
- Removing warnings without removing fallback logic would create false confidence.

## Security Considerations

- Backfill/reseed operations must avoid corrupting current recruiter-visible scoring data.
- If a repair script touches historical rows, it should be idempotent and auditable.

## Unresolved Questions

- Whether seed and historical data can be regenerated instead of backfilled.

## Next Steps

- Hand final matching/read-path decisions to Phase 5 so rollout checklist can block release if old rows are still incompatible.