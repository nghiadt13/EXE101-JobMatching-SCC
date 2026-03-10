# Phase 1: Routing Contract and Flag Policy

Status: Completed (2026-03-10)

## Goal

Define a single routing contract for public job browsing so implementation is deterministic.

## Tasks

1. Create `PUBLIC_JOBS_LISTING_PATH` constant (target `/`).
2. Inventory all listing-route usages (`/jobs`) in web app and classify:
   - hard redirect
   - nav link
   - CTA link
   - callback URL
   - SEO target
3. Define compatibility policy for `/jobs`:
   - Option A: server redirect to `/` with query preservation.
   - Option B: render alias page that proxies same component/data as `/`.
4. Define feature-flag precedence:
   - `WEB_HOME_TOPCV_V1_ENABLED` controls UI shell.
   - `WEB_JOBS_FILTERS_V1_ENABLED` controls filter stack behavior on listing surface.

## Edge Cases

- `/jobs` called with unknown params.
- `/jobs?page=...` deep links from email/bookmark.
- Both flags disabled (safe fallback must still provide listing access path).

## Deliverables

- Route contract doc snippet in plan notes.
- Mapping table old route -> new route behavior.

## Implementation Notes

- Added `apps/web/lib/routes.ts` as single source of truth:
  - `PUBLIC_JOBS_LISTING_ROUTE = '/'`
  - `LEGACY_JOBS_LISTING_ROUTE = '/jobs'`
- Implemented compatibility behavior using server redirect on legacy listing route with query preservation.
