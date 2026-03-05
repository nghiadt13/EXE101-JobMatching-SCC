# Phase 5: Testing, Hardening, And Docs Sync

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-applications-api-apply-and-persistence.md)
- [Phase 3](./phase-03-recruiter-application-review-and-status-updates.md)
- [Phase 4](./phase-04-web-integration-candidate-recruiter-application-views.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2.5h

Verify end-to-end correctness and update docs/checklists.

## Requirements

### Functional

- Unit tests:
  - transition matrix
  - score persistence mapping
  - unique-race error mapping to `409`
- E2E tests:
  - candidate apply success
  - duplicate apply conflict
  - recruiter status update success/invalid transition
  - visibility 404 paths
- Update docs:
  - `docs/03-api-endpoints.md`
  - `docs/05-implementation-checklist.md`
  - smoke checklist for applications flow

### Non-functional

- Pass commands:
  - `npm run lint -w api`
  - `npm run test -w api -- --runInBand`
  - `npm run test:e2e -w api -- --runInBand`
  - `npm run build -w api`
  - `npm run lint -w web`
  - `npm run build -w web`

## Todo List

- [x] Unit tests added.
- [x] E2E tests added.
- [x] API/web validation commands passing.
- [x] Docs/checklist synced.

## Unresolved Questions

- None.
