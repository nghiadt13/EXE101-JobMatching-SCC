# Phase 3: Recruiter Application Review And Status Updates

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-applications-api-apply-and-persistence.md)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Complete recruiter-facing endpoints for listing, detail, and status updates.

## Requirements

### Functional

- `GET /applications`:
  - candidate: own applications
  - recruiter: applications for own jobs
  - support pagination + status filter
- `GET /applications/:id` with strict visibility checks.
- `PATCH /applications/:id/status` (recruiter owner only):
  - enforce transition matrix
  - persist optional notes

### Non-functional

- Keep query count reasonable (single list query + count).
- Return `404` for inaccessible resources (avoid enumeration leaks).

## Todo List

- [x] Role-based list endpoint done.
- [x] Detail endpoint done.
- [x] Status update endpoint with matrix guard done.

## Unresolved Questions

- None.
