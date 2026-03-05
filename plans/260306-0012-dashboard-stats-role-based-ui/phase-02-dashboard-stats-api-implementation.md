# Phase 2: Dashboard Stats API Implementation

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-dashboard-metrics-contract-and-role-matrix.md)
- [Auth Module](../../apps/api/src/auth)
- [Application Module](../../apps/api/src/applications)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Implement backend module/service/controller for role-based dashboard stats.

## Requirements

### Functional

- Add `DashboardModule` with `DashboardController` and `DashboardService`.
- Add authenticated endpoint `GET /dashboard/stats`.
- Service computes metrics by role:
  - candidate: counts from own candidate/applications
  - recruiter: counts from own jobs and related applications
  - admin: system-wide aggregates
- Ensure recruiter metrics only count own jobs.

### Non-functional

- Use `Promise.all` for independent count queries.
- Return `404` for missing candidate profile (candidate role).

## Files To Create

- `apps/api/src/dashboard/dashboard.module.ts`
- `apps/api/src/dashboard/dashboard.controller.ts`
- `apps/api/src/dashboard/dashboard.service.ts`
- `apps/api/src/dashboard/dashboard.types.ts`
- `apps/api/src/dashboard/dashboard.service.spec.ts`

## Files To Modify

- `apps/api/src/app.module.ts`
- `docs/03-api-endpoints.md`

## Todo List

- [x] Dashboard API endpoint implemented.
- [x] Role-based stats queries implemented.
- [x] Unit tests for role branches implemented.

## Unresolved Questions

- None.

