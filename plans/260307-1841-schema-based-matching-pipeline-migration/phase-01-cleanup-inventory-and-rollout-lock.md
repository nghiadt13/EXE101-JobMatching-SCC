# Phase 1: Cleanup, Inventory, And Rollout Lock

## Context Links

- [Plan Overview](./plan.md)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)
- [Applications Service](../../apps/api/src/applications/applications.service.ts)
- [Recruiter Applications Table](../../apps/web/components/applications/recruiter-applications-table.tsx)
- [Candidate Applications Table](../../apps/web/components/applications/candidate-applications-table.tsx)
- [Matching Algorithm Doc](../../docs/04-matching-algorithm.md)

## Overview

**Priority:** P1  
**Status:** Pending  
**Estimate:** 4h

Create one migration boundary before any implementation. Remove clearly obsolete artifacts, list live dependencies on TF-IDF + skill-atom scoring, and lock rollout rules so cleanup happens in the right order.

## Key Insights

- Legacy matching is no longer just backend math; it is encoded in DB fields, docs, API types, and recruiter/candidate screens.
- Current runtime already mixes matching versions and compatibility behavior, so deletion must be sequenced.
- `tmp/matching-text-test/compare.js` looks like prototype-only exploration and should be explicitly validated as non-runtime before deletion or archive.

## Requirements

### Functional

- Inventory all FE and BE reads of `tfidfScore`, `skillsScore`, `matchingSnapshot.componentScores`, `matchedSkills`, and `missingSkills`.
- Identify dead code, prototype-only code, stale docs, and compatibility paths that should be deleted early.
- Define short-lived compatibility boundaries that stay until schema scoring is live.

### Non-Functional

- No functional behavior change in this phase except removing unused artifacts.
- Every deletion must be low-risk and validated as non-runtime.

## Architecture

```text
legacy matching references audit
  -> runtime keep
  -> runtime adapt later
  -> dead code delete now
  -> docs update after cutover
```

## Related Code Files

### Files To Modify

- `apps/api/src/matching/matching.service.ts`
- `apps/api/src/applications/applications.service.ts`
- `apps/web/lib/applications-client.ts`
- `docs/04-matching-algorithm.md`
- `README.md`

### Files To Delete

- `tmp/matching-text-test/compare.js` if confirmed non-runtime
- Any superseded matching notes under `tmp/` or duplicate prototype helpers

## Implementation Steps

1. Audit every runtime consumer of legacy score fields and snapshot shape.
2. Split findings into:
   - delete now
   - keep until cutover
   - adapt for mixed old/new snapshots
3. Collapse matching entry to one facade so old logic is not spread across controllers/services.
4. Delete confirmed non-runtime prototype code under `tmp/`.
5. Mark the following as deprecated runtime concepts:
   - TF-IDF component
   - exact skill overlap as final explanation model
   - snapshot fields tied only to skill overlap
6. Lock rollout rule: do not remove DB columns or API fields until the new snapshot is live in FE and old applications can still render.

## Todo List

- [ ] Runtime legacy dependency inventory written.
- [ ] Dead prototype and temp files removed.
- [ ] One compatibility boundary for matching locked.
- [ ] Cleanup order agreed before schema changes start.

## Success Criteria

- Team has a precise delete/refactor/preserve list before touching schema or scorer logic.
- No user-facing behavior regresses from premature deletion.

## Risk Assessment

- **Risk:** A field that looks obsolete is still used in a list page or DTO.
- **Mitigation:** grep audit plus route-level smoke checks before deletion.

## Security Considerations

- Remove temp artifacts that may contain ad hoc experimental data or misleading outputs.

## Next Steps

- Start additive schema design only after the legacy dependency map is complete.

## Unresolved Questions

- None.