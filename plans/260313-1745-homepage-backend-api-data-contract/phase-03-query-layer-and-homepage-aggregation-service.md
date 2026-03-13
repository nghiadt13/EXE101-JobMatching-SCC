# Phase 3: Query Layer and Homepage Aggregation Service

Status: Proposed

## Goal

Implement query composition and response mapping for one aggregated homepage payload.

## Tasks

1. Build repository/query methods:
   - latest market stats snapshot
   - industry demand series
   - trusted companies
   - category counts
   - top location filters
   - featured published jobs
   - homepage content row
2. Add optional user-context resolvers:
   - saved jobs lookup by user
   - unread notification count
3. Implement mapper for frontend-ready fields:
   - `salaryText`
   - `locationLabel`
   - `isSaved`
4. Add fallback policies:
   - empty arrays for missing datasets
   - placeholder-safe hero/footer payload
5. Keep DB query count controlled:
   - batch/parallelize reads
   - avoid N+1 on featured jobs relations.

## Deliverables

- `HomepageAggregationService` with deterministic output shape.
- Unit tests for mapping helpers and fallback behavior.

## Exit Criteria

- Service returns complete payload for guest and authenticated users.
- Query performance is acceptable on seeded data volumes.

