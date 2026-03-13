# Phase 1: Client Contract and Data Layer

Status: Proposed

## Goal

Create a clean, typed frontend API client for homepage endpoints.

## Tasks

1. Add `apps/web/lib/homepage-client.ts`:
   - `getHomepage(params?, token?)`
   - `saveHomepageJob(jobId, token)`
   - `unsaveHomepageJob(jobId, token)`
   - `getUnreadNotificationCount(token)`
2. Add TypeScript types mirroring OpenAPI:
   - `HomepageResponse`
   - `HomepageFeaturedJob`
   - `HomepageCategory`
   - `HomepageLocationFilter`
   - `SaveJobResponse`
3. Reuse existing `createApiError` style for consistent error handling.
4. Keep `cache: 'no-store'` default for correctness in first integration.

## Deliverables

- `apps/web/lib/homepage-client.ts`
- Typed models for homepage payload

## Exit Criteria

- Frontend can call all homepage endpoints from one client module.
- Types are aligned with backend contract.

