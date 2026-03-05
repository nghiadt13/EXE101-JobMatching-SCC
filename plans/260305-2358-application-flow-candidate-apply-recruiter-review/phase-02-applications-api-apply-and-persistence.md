# Phase 2: Applications API Core (Apply + Persistence)

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-application-contract-rules-status-baseline.md)
- [Matching Module](../../apps/api/src/matching/matching.module.ts)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3.5h

Implement applications module core and persist score from matching service.

## Requirements

### Functional

- Create module/controller/service/dto/types for applications.
- Implement `POST /applications` (candidate-only):
  - validate candidate ownership of CV
  - validate target job is published and visible
  - call `matchingService.calculateIntegrationPayload(cvId, jobId, actor)`
  - persist `matchScore`, `tfidfScore`, `skillsScore`
  - return contract response
- Enforce unique apply (`jobId + candidateId`) with `409` on race.

### Non-functional

- Avoid formula duplication.
- No raw CV/job text leakage in response.

## Files To Create

- `apps/api/src/applications/applications.module.ts`
- `apps/api/src/applications/applications.controller.ts`
- `apps/api/src/applications/applications.service.ts`
- `apps/api/src/applications/applications.types.ts`
- `apps/api/src/applications/dto/create-application.dto.ts`
- `apps/api/src/applications/dto/query-applications.dto.ts`
- `apps/api/src/applications/dto/update-application-status.dto.ts`

## Todo List

- [x] Apply endpoint implemented.
- [x] Matching persistence integrated.
- [x] Unique-race conflict handling implemented.

## Unresolved Questions

- None.
