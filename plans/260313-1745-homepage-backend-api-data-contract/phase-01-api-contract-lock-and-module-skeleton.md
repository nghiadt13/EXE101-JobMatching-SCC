# Phase 1: API Contract Lock and Module Skeleton

Status: Proposed

## Goal

Lock request/response contract and create backend module skeleton before schema/service implementation.

## Tasks

1. Freeze `GET /api/home` response DTO from OpenAPI spec.
2. Define DTOs/interfaces for:
   - hero
   - market stats
   - trend series
   - category cards
   - location filters
   - featured jobs
   - footer links
   - current user block
3. Create `homepage` backend module scaffold:
   - controller
   - service
   - mapper
   - types
4. Align with standard error envelope and auth guards policy:
   - `GET /api/home`: public, user context optional
   - save/unsave: authenticated
5. Confirm endpoint naming consistency with existing `/api` conventions.

## Deliverables

- Contract checklist signed off.
- New module scaffold in `apps/api/src/homepage/*`.
- DTO/type definitions committed.

## Exit Criteria

- No unresolved contract ambiguity between frontend and backend.
- Team agrees on nullable/fallback behavior for each section.

