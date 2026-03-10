# Phase 02: API Filter Contract v1 and Query Foundation

## Context Links

- Parent: [plan.md](./plan.md)
- Previous: [phase-01](./phase-01-product-contract-ia-and-ux-guardrails.md)
- Relevant code:
  - `../../apps/api/src/jobs/dto/query-jobs.dto.ts`
  - `../../apps/api/src/jobs/jobs.service.ts`
  - `../../apps/api/src/jobs/jobs.types.ts`
  - `../../apps/api/src/jobs/jobs.controller.ts`
  - `../../apps/api/src/jobs/jobs.service.spec.ts`
  - `../../apps/api/prisma/schema.prisma`

## Overview

- Priority: P1
- Status: In Progress
- Estimate: 10h
- Owner: BE Lead
- Approver: Tech Lead
- Handoff Output: API contract doc + test matrix + feature-flag checklist
- Goal: mở rộng `GET /jobs` cho filter/sort cần thiết, giữ backward compatibility.

## Key Insights

- Current `buildListWhere` chỉ hỗ trợ text search trong `title/description` + status role-based.
- `employmentType`, `salaryMin`, `salaryMax` đã là cột chuẩn; có thể lọc ngay.
- `location` và `skills` đang ở JSON, nên v1 cần pragmatic, tránh migration nặng ngay.
- Facets và relevance có risk/perf cao, không nên ship chung batch với core filtering.

## Requirements

Functional:

- Additive query params:
  - `q` (alias từ `search`)
  - `sort` (`newest`, `salary_asc`, `salary_desc`)
  - `employmentTypes`
  - `remote`
  - `salaryMinGte`, `salaryMaxLte`
  - `postedWithinDays`
- Optional/flagged:
  - `includeFacets` (chỉ bật khi `API_JOBS_FACETS_V1_ENABLED=true`)
- Role-safe behavior:
  - Public/candidate luôn `PUBLISHED`
  - Recruiter giữ semantics own jobs + optional status.
- Additive response fields: `meta`, `facets` (optional).
- Facets bắt buộc dùng đúng RBAC-scoped `where` như `items`, không query scope khác.
- Facet buckets count < 5 bị ẩn để giảm side-channel leakage.

Non-functional:

- Query validation chặt, cap page/limit.
- No SQL interpolation raw không an toàn.
- Không làm breaking change cho web đang chạy.
- Rate-limit theo IP/user cho `GET /jobs` (stricter khi `includeFacets=true`).
- Không log raw `q`; analytics/event chỉ dùng hash/bucket query.
- Perf gate bắt buộc trước canary: `EXPLAIN ANALYZE` + p95 target.

## Architecture

- DTO parse + normalize query.
- Service:
  - `buildListWhereV1(viewer, query)`
  - `buildOrderBy(query)`
  - optional `computeFacets` khi `includeFacets=true` và feature flag bật.
- Response mapper giữ shape cũ + meta/facets.
- Feature flags (server-side kill-switch):
  - `API_JOBS_FILTERS_V1_ENABLED`
  - `API_JOBS_FACETS_V1_ENABLED`

## Related Code Files

Modify:

- `apps/api/src/jobs/dto/query-jobs.dto.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.types.ts`
- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/api/test/app.e2e-spec.ts`
- `docs/03-api-endpoints.md`

Optional (if needed after perf check):

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/*job_filters_v1*/migration.sql`

## Implementation Steps

1. Extend `QueryJobsDto` với params mới + transform CSV -> string[] unique.
2. Implement alias mapping `search -> q` với precedence của `q`.
3. Extend where builder:
   - text search (q)
   - employment type
   - remote from `location` JSON metadata
   - salary range overlap
   - published date window.
4. Add sort builder with safe fallbacks.
5. Define `q` privacy rules:
   - max length
   - reject obvious email/phone patterns
   - redact in logs.
6. Add `meta.appliedFilters` and optional `facets` with exact RBAC scope reuse.
7. Update docs endpoint contract.
8. Add unit test matrix:
   - alias precedence `q` vs `search`
   - malformed CSV/cardinality overflow
   - salary inversion
   - timezone edge cho `postedWithinDays`
   - pagination overflow.
9. Add e2e tests cho legacy query + new query coexistence.
10. Run `EXPLAIN ANALYZE` check cho query phổ biến, chốt index/migration quyết định.

## Todo List

- [x] Query DTO v1 completed.
- [x] Service where/sort v1 completed.
- [x] Feature flags/kill-switches completed.
- [ ] Legacy compatibility tests pass.
- [ ] New filter/sort tests pass.
- [ ] Boundary + timezone matrix tests pass.
- [ ] Perf gate signed off.
- [x] API docs updated.

## Success Criteria

- Client cũ gọi `/jobs` không đổi code vẫn chạy đúng.
- Query filter/sort mới trả kết quả đúng role scope.
- Test matrix pass cho case role/filter/boundary/timezone.
- `/jobs` p95 <= 350ms trên dataset kiểm thử chuẩn trước canary.

## Risk Assessment

- Risk: facets query tốn tài nguyên.
- Mitigation: chỉ compute khi `includeFacets=true` + flag bật, RBAC scope reuse, suppress bucket nhỏ, có rate limit riêng.

## Security Considerations

- Chặn query injection bằng validation + parameterized Prisma usage.
- Enforce cap cho `limit` và cardinality của CSV filters.
- Không log `Authorization`, cookie, raw `q` trong logs.
- Redaction rules được unit test.

## Next Steps

- Phase 3 consume contract v1-core trong UI `/jobs`.
- Facets/relevance chỉ implement sau nếu perf gate cho phép.

