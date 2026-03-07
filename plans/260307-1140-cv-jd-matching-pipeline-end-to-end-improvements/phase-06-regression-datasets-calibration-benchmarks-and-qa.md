# Phase 6: Regression Datasets, Calibration, Benchmarks, And QA

## Context Links

- [Plan Overview](./plan.md)
- [Implementation Checklist](../../docs/05-implementation-checklist.md)
- [Release Acceptance Matrix](../../docs/06-release-readiness-acceptance-matrix.md)
- [Matching Performance Notes](../../apps/api/src/matching/docs/matching-performance-notes.md)

## Overview

**Priority:** P1  
**Status:** Pending  
**Estimate:** 6h

Make the score upgrade measurable before release. This phase defines the regression set, calibration method, benchmark thresholds, and QA gates needed to ship without hand-waving.

## Key Insights

- Current docs still mark ranking and matching reasonableness as incomplete.
- The verified bug sample proves existing unit coverage is too shallow for real data shapes.
- Score changes without a benchmark set will create endless debate and no trustworthy release gate.

## Requirements

### Functional

- Build regression fixtures covering grouped skills, aliases, manual edits, and low-confidence parses.
- Define benchmark commands and acceptable runtime budget.
- Define score calibration review with product or recruiter proxy signoff.
- Update smoke and release gates.

### Non-Functional

- Prefer deterministic fixtures over ad hoc local samples.
- Calibration should tune thresholds and labels first, not rush into complex new algorithms.

## Architecture

```text
fixtures
  -> unit tests for atomization and scoring
  -> integration tests for apply flow
  -> benchmark script for batch match timing
  -> calibration review sheet
  -> release gate
```

## Related Code Files

### Files To Modify

- `apps/api/src/matching/calculators/skills-calculator.service.spec.ts`
- `apps/api/src/matching/matching.service.spec.ts`
- `apps/api/src/applications/applications.service.spec.ts`
- `docs/05-implementation-checklist.md`
- `docs/06-release-readiness-acceptance-matrix.md`
- `apps/web/docs/application-flow-smoke-checklist.md`

### Files To Create

- `apps/api/test/fixtures/matching-regression-cases.json`
- `apps/api/scripts/benchmark-matching.ts`
- `plans/reports/matching-v2-calibration-report.md`

### Files To Delete

- None.

## Implementation Steps

1. Build a fixture set with labeled expectations:
   - full exact overlap
   - grouped CV skill vs atomic JD skill
   - grouped JD skill vs atomic CV skill
   - alias variant cases
   - empty or low-confidence parse cases
   - manual override cases
2. Add unit tests at three layers:
   - atomizer/canonicalizer
   - skills score calculator
   - matching service facade
3. Add integration tests for `POST /applications` to confirm backward compatibility and snapshot persistence.
4. Define benchmark target for batch matching on local seed data. Keep threshold relative and simple.
5. Produce calibration report:
   - compare legacy vs v2 on the regression set
   - document false positives and false negatives
   - adjust explanation labels and warning thresholds if needed
6. Update acceptance matrix so release requires ranking and explanation checks, not only score presence.

## Todo List

- [ ] Regression fixture set created.
- [ ] Unit and integration tests expanded.
- [ ] Benchmark script added.
- [ ] Calibration report template completed.
- [ ] Release gates updated.

## Success Criteria

- The known grouped-skill bug is permanently covered by automated tests.
- V2 scoring shows measurable quality improvement on the regression set.
- Runtime remains acceptable for recruiter review lists and apply flow.

## Risk Assessment

- **Risk:** Fixture expectations are too vague to catch regressions.
- **Mitigation:** Use explicit ranges and rationale for each case.

- **Risk:** Teams start changing weights before validating input quality improvements.
- **Mitigation:** Separate calibration of thresholds/labels from formula changes in this release.

## Security Considerations

- Regression fixtures must avoid real personal data; use sanitized synthetic samples only.

## Next Steps

- Wire monitoring, rollout, and rollback around the validated implementation.

## Unresolved Questions

- Who gives final ranking-quality signoff if no recruiter stakeholder is available during development.