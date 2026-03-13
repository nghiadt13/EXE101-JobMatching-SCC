# Phase 5: Tests, Observability, and Rollout

Status: Proposed

## Goal

Harden homepage backend APIs for production release with measurable quality gates.

## Tasks

1. Test suite
   - unit tests for formatters/mappers
   - integration tests for `GET /api/home`
   - auth tests for save/unsave and unread count
   - error-envelope consistency tests
2. Performance checks
   - baseline uncached latency
   - cached latency target verification
   - query count and index usage validation
3. Observability
   - structured logs with requestId and section timing
   - metrics: hit rate, cache miss latency, error rate by endpoint
4. Rollout plan
   - feature flag or staged enablement for frontend consumption
   - monitor first 24h after release
5. Rollback plan
   - endpoint fallback behavior
   - migration rollback/disable procedure
   - cache bypass fallback switch

## Deliverables

- Test evidence report.
- Monitoring checklist and dashboard notes.
- Release and rollback runbook entry.

## Exit Criteria

- Critical tests pass.
- No blocking regression on existing API modules.
- Backend and frontend teams sign off contract readiness.

