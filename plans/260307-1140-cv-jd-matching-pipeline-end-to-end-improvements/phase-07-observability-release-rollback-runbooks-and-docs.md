# Phase 7: Observability, Release, Rollback, Runbooks, And Docs

## Context Links

- [Plan Overview](./plan.md)
- [Matching Algorithm Doc](../../docs/04-matching-algorithm.md)
- [Implementation Checklist](../../docs/05-implementation-checklist.md)
- [Release Acceptance Matrix](../../docs/06-release-readiness-acceptance-matrix.md)

## Overview

**Priority:** P1  
**Status:** Pending  
**Estimate:** 4h

Close the loop operationally. This phase defines what to monitor, how to release, how to roll back, and which docs must be updated so the improved matching pipeline is supportable after merge.

## Key Insights

- A matching change that reorders recruiter views is operationally sensitive even if the API contract stays additive.
- Backfill and feature-flag rollout need explicit runbooks, not tribal knowledge.
- Existing docs describe the MVP algorithm but not the canonical-vs-display skill model.

## Requirements

### Functional

- Add rollout checklist, rollback steps, and operational verification.
- Define logs and metrics for backfill completion, legacy fallback usage, and v2 scoring adoption.
- Update product docs and smoke docs.

### Non-Functional

- Keep monitoring simple enough for the current stack.
- Prefer structured logs and counters over building a new analytics subsystem.

## Architecture

```text
deploy migration
  -> enable dual-write
  -> run dry-run backfill
  -> run write backfill
  -> enable v2 in non-prod
  -> run regression and smoke gates
  -> enable v2 in prod/local demo env
  -> monitor fallback and ranking anomalies
```

## Related Code Files

### Files To Modify

- `docs/04-matching-algorithm.md`
- `docs/05-implementation-checklist.md`
- `docs/06-release-readiness-acceptance-matrix.md`
- `README.md`
- `apps/web/docs/application-flow-smoke-checklist.md`

### Files To Create

- `docs/matching-v2-operational-runbook.md`
- `docs/matching-v2-rollback-checklist.md`
- `plans/reports/matching-v2-release-readiness-summary.md`

### Files To Delete

- None.

## Implementation Steps

1. Add structured logging for:
   - legacy fallback reads where `skillAtoms` are missing
   - backfill processed/succeeded/failed counts
   - matching version used during application creation
2. Define rollout sequence:
   - deploy additive schema
   - enable dual-write
   - complete backfill
   - enable v2 in test/staging environment
   - validate regression and smoke results
   - enable v2 broadly
3. Define rollback sequence:
   - switch `MATCHING_VERSION` back to `legacy`
   - keep dual-write or canonical fields in place
   - stop recalculation jobs
   - preserve migrated data for later retry
4. Update documentation:
   - algorithm doc explains canonical skill atoms and stable first-release weights
   - checklist includes backfill and recruiter ranking validation
   - readiness matrix includes explanation, ranking, and rollback signoff
5. Produce operator runbook for junior developers with commands, expected outputs, and failure handling.

## Todo List

- [ ] Logs and counters defined.
- [ ] Rollout checklist written.
- [ ] Rollback checklist written.
- [ ] Core docs updated.
- [ ] Release summary template added.

## Success Criteria

- A developer can deploy, backfill, validate, and roll back using only the documented runbook.
- Post-release monitoring can distinguish legacy fallback from true scoring bugs.

## Risk Assessment

- **Risk:** Teams forget to disable recalculation jobs during rollback.
- **Mitigation:** Put rollback order in one checklist and make it part of signoff.

- **Risk:** Docs lag the implementation and operators use stale steps.
- **Mitigation:** Make docs updates part of the release gate, not a follow-up task.

## Security Considerations

- Operational logs must avoid storing raw CV or JD text.
- Runbooks should not require developers to inspect sensitive document contents unless explicitly necessary.

## Next Steps

- Execute only after Phases 1-6 pass their implementation and QA gates.

## Unresolved Questions

- Whether the project will treat local-only release and production release as the same runbook or maintain separate environment sections.