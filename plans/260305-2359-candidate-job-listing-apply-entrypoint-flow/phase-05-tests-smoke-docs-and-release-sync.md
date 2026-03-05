# Phase 5: Tests, Smoke Docs, And Release Sync

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-job-list-candidate-ux-and-apply-entrypoint.md)
- [Phase 3](./phase-03-job-detail-apply-flow-hardening.md)
- [Application Smoke Checklist](../../apps/web/docs/application-flow-smoke-checklist.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 1.5h

Finalize verification and sync docs/checklist evidence.

## Requirements

### Functional

- Run validation commands:
  - `npm run lint -w api`
  - `npm run test -w api -- --runInBand`
  - `npm run build -w api`
  - `npm run lint -w web`
  - `npm run build -w web`
- Update smoke checklist with candidate browse->apply path if changed.
- Sync implementation checklist/plan statuses after verification.

### Non-functional

- Do not mark pass unless evidence exists.
- Keep release notes concise and factual.

## Todo List

- [x] Validation commands passed.
- [x] Smoke checklist updated.
- [x] Plan/checklist synced.

## Unresolved Questions

- None.
