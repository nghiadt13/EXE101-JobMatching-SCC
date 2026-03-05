# Phase 1: Application Contract, Rules, And Status Baseline

## Context Links

- [Plan Overview](./plan.md)
- [Schema](../../apps/api/prisma/schema.prisma)
- [API Endpoints](../../docs/03-api-endpoints.md)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Freeze API contracts, role permissions, and status transition matrix before coding.

## Requirements

### Functional

- Finalize request/response for `POST /applications`:
  - request: `{ jobId, cvId }`
  - response: `{ id, matchScore, breakdown: { tfidfScore, skillsScore } }`
- Finalize list/detail response shape for candidate/recruiter.
- Freeze status transition matrix for recruiter endpoint:
  - `APPLIED -> REVIEWING|REJECTED`
  - `REVIEWING -> INTERVIEW|REJECTED`
  - `INTERVIEW -> OFFER|REJECTED`
  - `OFFER -> REJECTED` (optional MVP)
- Clarify role access:
  - candidate: create + view own
  - recruiter: view/update only applications on own jobs
  - admin: optional read-only or full (decide and document)

### Non-functional

- Clear error mapping: `400/401/403/404/409`.
- Deterministic and auditable transition behavior.

## Todo List

- [x] Contract frozen.
- [x] Access matrix frozen.
- [x] Transition matrix frozen.

## Unresolved Questions

- Admin scope deferred for now (MVP keeps candidate/recruiter only endpoints).
