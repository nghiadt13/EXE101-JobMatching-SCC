# Phase 7: Backfill, Validation, Rollout, And Docs Sync

## Context Links

- [Plan Overview](./plan.md)
- [README](../../README.md)
- [Database Schema Doc](../../docs/02-database-schema.md)
- [API Endpoints Doc](../../docs/03-api-endpoints.md)
- [Matching Algorithm Doc](../../docs/04-matching-algorithm.md)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 4h

Validate the new pipeline on real scenarios, roll out safely in a resettable environment, then remove legacy documentation and deprecated columns/logic once the new path is proven.

## Key Insights

- This workspace can reset the database from scratch, so destructive cleanup is acceptable.
- Upload and application paths are already schema-only; validation now matters more than compatibility scaffolding.
- Seed/demo data should exercise `matchingSnapshot` so UI review surfaces stay covered.

## Requirements

### Functional

- Validate reset + migrate flow with the final schema.
- Remove deprecated application score columns and runtime remnants.
- Update docs and smoke checklists to the new matching model.

### Non-Functional

- Rollout assumptions must be explicit: resettable DB, no historical preservation requirement.
- Validation must cover score quality, not just type safety.

## Validation Strategy

- Backend tests:
  - schema validators
  - evaluator rules
  - scoring determinism
  - mixed-version snapshot serialization
- End-to-end scenarios:
  - CV upload parse failure still surfaces immediately
  - JD upload parse failure still surfaces immediately
  - application create stores schema snapshot
  - recruiter list sorts and renders new scores
- Regression dataset:
  - alias mismatch cases
  - grouped-skill false negatives
  - underqualified but keyword-heavy CVs
  - multilingual CV/JD samples
  - recruiter/candidate application tables rendering `matchingSnapshot`

## Related Code Files

### Files To Modify

- `README.md`
- `docs/02-database-schema.md`
- `docs/03-api-endpoints.md`
- `docs/04-matching-algorithm.md`
- `docs/05-implementation-checklist.md`
- relevant API/web smoke checklists

### Files To Create

- rollout checklist and rollback notes

### Files To Delete Or Replace

- remove TF-IDF + 70/30 formula documentation
- remove obsolete legacy rollout notes after full cutover

## Implementation Steps

1. Reset and migrate the database with the final schema.
2. Verify no active create/update path writes legacy application score fields.
3. Run backend build, web build, API unit tests, and API e2e tests.
4. Update core docs and smoke checklists to schema-based terminology.
5. Remove TF-IDF/exact-skill runtime remnants and deprecated DB columns.

## Todo List

- [x] Reset + migration flow verified.
- [x] Regression validation executed via build + unit/e2e.
- [x] Legacy docs replaced.
- [x] Deprecated columns and runtime remnants removed.
- [x] Seed/demo data updated to schema snapshots.

## Success Criteria

- Active jobs and CVs needed for live matching are schema-backed before full cutover.
- Docs, API contracts, and UI all describe the same matching model.
- Repo is clean of legacy TF-IDF/exact-skill runtime in the live application path.

## Risk Assessment

- **Risk:** Old application history confuses support or recruiters.
- **Mitigation:** this rollout assumes resettable DB; no historical preservation is required in the current environment.

## Security Considerations

- Backfill jobs must use the same safe logging and redaction rules as live uploads.

## Next Steps

- If this code is promoted to an environment with real historical data, add a dedicated backfill/rewrite plan before applying the destructive migration.

## Unresolved Questions

- None.