# Phase 5: Validation, Tests, Rollout, And Docs

## Context Links

- [Plan Overview](./plan.md)
- [API Specs](../../apps/api/src/**/*.spec.ts)
- [README](../../README.md)
- [Docs Checklist](../../docs/05-implementation-checklist.md)

## Overview

**Priority:** P1  
**Status:** In Progress  
**Estimate:** 4h

Lock reliability with tests and rollout controls before making unified normalization default.

## Requirements

- Unit tests for CV/JD normalizer success + fallback + invalid JSON repair path.
- Integration tests for create/update CV/JD persist normalized payload.
- Matching tests verify adapter behavior on mixed legacy/new rows.
- Docs update for env/config and troubleshooting parse quality.

## Implementation Steps

1. Add backend tests for normalization + validation pipeline.
2. Add web smoke checklist for recruiter/candidate parse review UX.
3. Add feature flag (env) for gradual rollout if needed.
4. Run quality gates: lint/test/build API + web.

## Success Criteria

- [x] Unified parse path covered by automated tests.
- [ ] Rollback path exists via feature flag.
- [x] Developer docs updated and reproducible.

## Unresolved Questions

- None.
