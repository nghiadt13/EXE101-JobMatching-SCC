# Phase 1: Dashboard Metrics Contract And Role Matrix

## Context Links

- [Plan Overview](./plan.md)
- [API Endpoints](../../docs/03-api-endpoints.md)
- [Implementation Checklist](../../docs/05-implementation-checklist.md)
- [Schema](../../apps/api/prisma/schema.prisma)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Freeze the response contract for `GET /dashboard/stats` and the metrics matrix per role.

## Requirements

### Functional

- Define candidate response shape:
  - `totalApplications`
  - `pendingApplications`
  - `interviewCount`
- Define recruiter response shape:
  - `totalJobs`
  - `activeJobs`
  - `totalApplications`
  - `pendingReview`
- Define admin response shape:
  - `totalUsers`
  - `totalRecruiters`
  - `totalCandidates`
  - `totalJobs`
  - `totalApplications`
- Define unsupported role behavior and visibility guarantees.

### Non-functional

- Stable contract for frontend card rendering.
- Clear null/zero semantics (never return null for counters).

## Todo List

- [x] Contract frozen.
- [x] Role metrics matrix frozen.
- [x] Error behavior frozen.

## Unresolved Questions

- None.

