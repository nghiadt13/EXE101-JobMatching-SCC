# Phase 06: Testing, Rollout, Rollback, and Docs Sync

## Context Links

- Parent: [plan.md](./plan.md)
- Dependencies:
  - [phase-02](./phase-02-api-filter-contract-v1-and-query-foundation.md)
  - [phase-03](./phase-03-jobs-listing-ux-filters-chips-pagination.md)
  - [phase-04](./phase-04-homepage-topcv-style-implementation.md)
  - [phase-05](./phase-05-seo-and-tracking-instrumentation-baseline.md)

## Overview

- Priority: P1
- Status: In Progress
- Estimate: 5h
- Owner: QA Lead
- Approver: Tech Lead + Product Owner
- Handoff Output: release-readiness report + signed rollback checklist
- Goal: khóa chất lượng trước khi release, có đường rollback rõ nếu filter/homepage gây sự cố.

## Key Insights

- Jobs flow ảnh hưởng trực tiếp conversion candidate, regression risk cao.
- API contract mở rộng dễ gây edge-case khi query params kết hợp.
- Cần smoke checklist mới cho homepage + listing filters.

## Requirements

Functional:

- API unit/e2e tests cho filter/sort/legacy alias.
- Web smoke tests cho homepage/jobs/detail/apply.
- Update docs/checklist vận hành.
- Rollout bắt buộc qua feature flags.

Non-functional:

- Bám quality gates hiện repo.
- Log rõ requestId khi fail API.
- Rollout gates định lượng, không dùng tiêu chí cảm tính.

## Architecture

- Test pyramid:
  - API unit matrix (service)
  - API e2e query cases
  - Web smoke manual + selective automation.
- Rollout canary -> monitor -> full.
- Mandatory flags/kill-switches:
  - `API_JOBS_FILTERS_V1_ENABLED`
  - `API_JOBS_FACETS_V1_ENABLED`
  - `WEB_JOBS_FILTERS_V1_ENABLED`
  - `WEB_HOME_TOPCV_V1_ENABLED`
  - `WEB_TRACKING_V1_ENABLED`

## Related Code Files

Modify:

- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/api/test/app.e2e-spec.ts`
- `apps/web/docs/job-management-smoke-checklist.md`
- `docs/03-api-endpoints.md`
- `docs/05-implementation-checklist.md`

Create:

- `plans/260310-2005-homepage-topcv-job-listing-filters/reports/release-readiness.md`

## Implementation Steps

1. Add API unit matrix covering core combinations.
2. Add API e2e for public/recruiter behavior with new params.
3. Add boundary matrix tests:
   - `q` vs `search` precedence
   - malformed CSV/cardinality overflow
   - salary inversion
   - timezone edge for `postedWithinDays`
   - pagination overflow/deep page.
4. Execute web smoke flows:
   - guest homepage -> jobs list -> job detail
   - candidate login -> apply success/duplicate/no-cv cases.
5. Verify SEO artifacts generated correctly.
6. Verify tracking consent gate (pre-consent no-op).
7. Rollout plan:
   - canary 10% traffic trong tối thiểu 24h
   - gates: error rate < 1%, `/jobs` p95 <= 350ms, conversion drop <= 5%
   - full rollout only khi tất cả gates pass.
8. Define rollback:
   - tắt backend flags trước (`API_*`)
   - tắt web flags sau (`WEB_*`)
   - fallback legacy `/jobs` behavior ngay không cần redeploy.

## Todo List

- [ ] API unit tests pass.
- [ ] API e2e tests pass.
- [ ] Boundary + timezone matrix tests pass.
- [ ] Web smoke checklist pass.
- [ ] Consent-gating tests pass.
- [x] Docs updated.
- [x] Rollout + rollback runbook complete.

## Success Criteria

- Apply conversion drop <= 5% so baseline 7 ngày.
- Không có critical regression ở `/jobs` và `/jobs/[slug]`.
- Team có checklist + rollback rõ ràng.

## Risk Assessment

- Risk: latency tăng sau filter/sort additions.
- Mitigation: monitor p95 `/jobs`, fallback to legacy subset khi vượt ngưỡng.

## Security Considerations

- Query caps chống abuse (limit/filter cardinality).
- Redact sensitive data khỏi logs/events.
- Rollback phải cắt được backend attack surface, không chỉ ẩn UI.

## Next Steps

- Bắt đầu implementation theo phase order đã lock.

