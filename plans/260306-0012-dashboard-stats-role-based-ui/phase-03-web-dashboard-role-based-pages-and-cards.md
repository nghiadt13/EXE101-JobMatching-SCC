# Phase 3: Web Dashboard Role-based Pages And Cards

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-dashboard-stats-api-implementation.md)
- [Dashboard Routes](../../apps/web/app/dashboard)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Integrate stats API into candidate/recruiter/admin dashboard pages using reusable stat cards.

## Requirements

### Functional

- Add web dashboard client for `GET /dashboard/stats`.
- Candidate dashboard page renders candidate metrics cards.
- Recruiter dashboard page renders recruiter metrics cards.
- Admin dashboard page renders admin metrics cards.
- Preserve existing dashboard navigation links.

### Non-functional

- Keep rendering server-side with auth token checks.
- Avoid duplicated card JSX by extracting reusable component.

## Files To Create

- `apps/web/lib/dashboard-client.ts`
- `apps/web/components/dashboard/dashboard-stat-card.tsx`

## Files To Modify

- `apps/web/app/dashboard/candidate/page.tsx`
- `apps/web/app/dashboard/recruiter/page.tsx`
- `apps/web/app/dashboard/admin/page.tsx`

## Todo List

- [x] Dashboard client added.
- [x] Reusable stat card added.
- [x] All three role pages wired to real stats.

## Unresolved Questions

- None.

