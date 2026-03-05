# Phase 3: Full-Flow QA Execution And Bug-Fix Batch

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-acceptance-matrix-and-test-scope-lock.md)
- [Phase 2](./phase-02-demo-seed-data-hardening-and-scenario-coverage.md)
- [API Endpoints](../../docs/03-api-endpoints.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 4h

Execute full regression pass and resolve blocking defects discovered in Day 14 verification.

## Requirements

### Functional

- Run all quality commands:
  - `npm run lint -w api`
  - `npm run test -w api -- --runInBand`
  - `npm run test:e2e -w api -- --runInBand`
  - `npm run build -w api`
  - `npm run lint -w web`
  - `npm run build -w web`
- Execute manual smoke checklists:
  - `apps/web/docs/auth-smoke-checklist.md`
  - `apps/web/docs/user-management-smoke-checklist.md`
  - `apps/web/docs/cv-management-smoke-checklist.md`
  - `apps/web/docs/job-management-smoke-checklist.md`
  - `apps/web/docs/application-flow-smoke-checklist.md`
  - `apps/web/docs/dashboard-smoke-checklist.md`
- Fix high/critical defects discovered during run.

### Non-functional

- Keep fix batch scoped to defects only (no feature creep).
- Track each failing case with cause and resolution note.

## Todo List

- [x] Automated validation commands completed.
- [x] Manual smoke matrix completed.
- [x] Blocking defects fixed and retested.

## Unresolved Questions

- None.
