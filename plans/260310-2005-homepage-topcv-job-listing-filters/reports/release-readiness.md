# Release Readiness - Homepage + Jobs Filters v1

Date: 2026-03-10  
Scope: Phase 02-06 execution status snapshot

## Completed

- API `/jobs` additive contract implemented (query params v1, sort/filter, optional meta/facets behind flags).
- Web `/jobs` upgraded with URL-state filters, active chips, sort, and pagination.
- Homepage replaced with TopCV-style acquisition layout behind `WEB_HOME_TOPCV_V1_ENABLED`.
- SEO baseline shipped:
  - route metadata for `/`, `/jobs`, `/jobs/[slug]`
  - `app/sitemap.ts`
  - `app/robots.ts`
  - JSON-LD (`WebSite`, `JobPosting` with published-only emit policy)
- Tracking baseline shipped behind consent + flag:
  - `home_search_submitted`
  - `apply_attempted`
- Docs/checklists updated for API contract and smoke flows.

## Open Gates

- Full automated test run pending final verification pass.
- Canary rollout metrics pending:
  - `/jobs` p95 <= 350ms
  - error rate < 1%
  - conversion drop <= 5% vs baseline
- Rollback drill not yet executed in environment.

## Flags / Kill-Switches

- `API_JOBS_FILTERS_V1_ENABLED`
- `API_JOBS_FACETS_V1_ENABLED`
- `WEB_JOBS_FILTERS_V1_ENABLED`
- `WEB_HOME_TOPCV_V1_ENABLED`
- `NEXT_PUBLIC_WEB_TRACKING_V1_ENABLED`

## Rollout Sequence

1. Enable `API_JOBS_FILTERS_V1_ENABLED`.
2. Enable `WEB_JOBS_FILTERS_V1_ENABLED`.
3. Enable `WEB_HOME_TOPCV_V1_ENABLED`.
4. Enable facets/tracking flags after initial stability.

## Rollback Sequence

1. Disable API flags first (`API_*`).
2. Disable web flags (`WEB_*`, `NEXT_PUBLIC_WEB_TRACKING_V1_ENABLED`).
3. Verify legacy `/jobs` behavior and homepage fallback.
