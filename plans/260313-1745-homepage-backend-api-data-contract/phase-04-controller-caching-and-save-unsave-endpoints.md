# Phase 4: Controller, Caching, and Save/Unsave Endpoints

Status: Proposed

## Goal

Expose stable API endpoints and enforce caching/invalidation rules.

## Tasks

1. Implement `GET /api/home` controller endpoint:
   - optional auth context
   - validated response DTO
2. Implement save/unsave endpoints:
   - `POST /api/jobs/:jobId/save`
   - `DELETE /api/jobs/:jobId/save`
   - idempotent behavior and clear response shape
3. Implement optional unread endpoint:
   - `GET /api/notifications/unread-count`
4. Add caching:
   - cache key strategy by `(location, user role or anon)`
   - TTL 60-300 seconds
5. Add invalidation triggers:
   - job publish/close
   - homepage content update
   - saved job create/delete for current user payload branch

## Deliverables

- Working endpoints in controller.
- Cache utility wiring and invalidation hooks.
- Endpoint-level integration tests.

## Exit Criteria

- API endpoints are reachable and contract-compliant.
- Cache improves repeated response latency without stale critical data.

