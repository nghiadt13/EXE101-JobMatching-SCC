# Phase 5: Dashboard Testing, Docs, And Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-dashboard-stats-api-implementation.md)
- [Phase 3](./phase-03-web-dashboard-role-based-pages-and-cards.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Validate role-based correctness and sync documentation/checklists.

## Requirements

### Functional

- API tests:
  - candidate stats returns expected keys
  - recruiter stats scoped to own jobs
  - admin stats returns system counters
  - unauthorized requests rejected
- Web checks:
  - all dashboard role pages render with stats
  - fallback UI shown when stats request fails
- Update docs:
  - `docs/03-api-endpoints.md`
  - `docs/05-implementation-checklist.md`
  - dashboard smoke checklist in `apps/web/docs/`

### Non-functional

- Pass commands:
  - `npm run lint -w api`
  - `npm run test -w api -- --runInBand`
  - `npm run test:e2e -w api -- --runInBand`
  - `npm run build -w api`
  - `npm run lint -w web`
  - `npm run build -w web`

## Todo List

- [x] API tests added.
- [x] Web checks completed.
- [x] Docs/checklist synced.
- [x] API/web validation commands passing.

## Unresolved Questions

- None.

