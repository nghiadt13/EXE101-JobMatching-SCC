# Homepage Backend Handoff (2026-03-13)

Goal: convert the current homepage (UI mock) into a production-ready data-driven homepage with a clear backend/frontend contract.

## This folder contains

- `openapi-homepage-v1.yaml`: OpenAPI contract for backend implementation.
- `database-gap-analysis.md`: UI-to-backend data mapping plus likely schema gaps.
- `migration-draft-homepage.sql`: SQL draft for new tables/columns required by dynamic homepage data.

## Backend implementation scope

1. Implement aggregated homepage endpoint: `GET /api/home`.
2. Implement save/unsave job actions for the heart button:
   - `POST /api/jobs/{jobId}/save`
   - `DELETE /api/jobs/{jobId}/save`
3. Optional notifications endpoint:
   - `GET /api/notifications/unread-count`

## Contract principles

- Return frontend-ready values (for example: `salaryText`, `locationLabel`).
- Return empty arrays instead of `null` for list fields.
- Provide fallback-friendly fields for avatar/logo/background.
- Include sufficient metadata for charts, filter chips, and featured jobs.

## Technical decisions

- Cache `GET /api/home` for 60-300 seconds.
- Read metrics/charts from snapshot tables (avoid expensive runtime aggregation on large tables).
- `isSaved` in featured jobs is user-dependent; for guest users it should be `false`.
