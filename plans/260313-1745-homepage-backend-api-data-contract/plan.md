---
title: "Homepage Backend API and Data Contract Implementation"
description: "Implement backend APIs, schema extensions, aggregation logic, and caching so homepage renders real data from database instead of static UI placeholders."
status: proposed
priority: P1
effort: 24h
branch: main
tags: [backend, api, homepage, database, caching, testing]
blockedBy: []
blocks: []
created: 2026-03-13
---

# Homepage Backend API and Data Contract Implementation

## Objective

Deliver production-ready backend support for homepage dynamic content with one aggregated API contract (`GET /api/home`) plus save/unsave job actions and optional unread-notification count.

## Why This Plan

Homepage UI is currently hardcoded and cannot scale to real data updates. Backend must provide a stable contract so frontend can render all homepage sections from database consistently.

## In Scope

- Implement `GET /api/home` aggregated payload.
- Implement `POST /api/jobs/:jobId/save` and `DELETE /api/jobs/:jobId/save`.
- Implement optional `GET /api/notifications/unread-count`.
- Extend DB schema for homepage content, metrics snapshots, save-job relation, and metadata.
- Add service-level caching and invalidation rules.
- Add test coverage and rollout checklist.

## Out of Scope

- Rebuilding homepage UI/UX structure.
- Full CMS admin UI for content editing (API-ready schema only in this plan).
- Recommendation engine redesign.

## Contract Source of Truth

- `docs/HOMEPAGE_BACKEND_HANDOFF_2026-03-13/openapi-homepage-v1.yaml`
- `docs/HOMEPAGE_BACKEND_HANDOFF_2026-03-13/database-gap-analysis.md`
- `docs/HOMEPAGE_BACKEND_HANDOFF_2026-03-13/migration-draft-homepage.sql`

## Architecture Decisions

1. Serve homepage from a single aggregated API for lower frontend latency.
2. Use snapshot tables for metrics/charts to avoid expensive runtime aggregation.
3. Return frontend-ready fields (`salaryText`, `locationLabel`, `isSaved`) to reduce client-side formatting complexity.
4. Cache `GET /api/home` for 60-300 seconds; keep save/unsave APIs uncached.
5. Keep backward compatibility with existing auth/error envelope.

## Phases

| # | Phase | Effort | Status | Link |
|---|-------|--------|--------|------|
| 1 | API Contract Lock and Module Skeleton | 3h | Proposed | [phase-01](./phase-01-api-contract-lock-and-module-skeleton.md) |
| 2 | Schema and Migration Foundation | 5h | Proposed | [phase-02](./phase-02-schema-and-migration-foundation.md) |
| 3 | Query Layer and Homepage Aggregation Service | 6h | Proposed | [phase-03](./phase-03-query-layer-and-homepage-aggregation-service.md) |
| 4 | Controller, Caching, and Save/Unsave Endpoints | 5h | Proposed | [phase-04](./phase-04-controller-caching-and-save-unsave-endpoints.md) |
| 5 | Tests, Observability, and Rollout | 5h | Proposed | [phase-05](./phase-05-tests-observability-and-rollout.md) |

## Acceptance Criteria

1. Frontend can fetch all homepage sections from `GET /api/home` without hardcoded data.
2. Save/unsave heart action persists correctly per user.
3. API response follows OpenAPI contract and standard error envelope.
4. P95 response time for cached `GET /api/home` remains within target.
5. Migration is reversible and does not break existing job/application flows.

## Risks

- Migration complexity if new entities are introduced into existing `Job` relations.
- Data quality gaps (missing company/category metadata).
- Cache staleness after content updates.

## Mitigations

- Introduce nullable foreign keys first, then backfill progressively.
- Provide safe fallbacks for missing optional metadata in response mappers.
- Add explicit cache invalidation hooks on writes affecting homepage payload.

## Definition of Done

- Phase 1-5 complete.
- OpenAPI contract implemented and validated with tests.
- Release notes and rollback steps documented.
- Frontend team receives stable endpoint payload for homepage integration.

