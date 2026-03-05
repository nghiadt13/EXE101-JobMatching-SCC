# Phase 2: Job List Candidate UX And Apply Entrypoint

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-gap-audit-and-acceptance-contract.md)
- [Jobs Page](../../apps/web/app/jobs/page.tsx)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Make candidate job list clearer for action taking (view details/apply intent).

## Requirements

### Functional

- Ensure each published job card has clear action path:
  - view details
  - apply entry hint/action (depending chosen UX)
- Improve empty state copy for candidate guidance.
- Preserve public access for browsing published jobs.

### Non-functional

- Keep list render lightweight and SSR-friendly.
- Reuse existing design system styles.

## Files To Modify

- `apps/web/app/jobs/page.tsx`
- (optional) extracted job card component if duplication appears

## Todo List

- [x] Job list action affordance improved.
- [x] Empty/loading states clarified.
- [x] Public/candidate browse behavior preserved.

## Unresolved Questions

- None.
