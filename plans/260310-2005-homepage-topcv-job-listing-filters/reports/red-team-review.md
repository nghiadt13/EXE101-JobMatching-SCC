# Red Team Review Report

- Plan: [../plan.md](../plan.md)
- Date: 2026-03-10
- Reviewers: 4 hostile lenses (Security, Failure Modes, Assumption, Scope)

## Summary

- Raw findings: 32
- Deduplicated findings: 11
- Accepted: 10
- Rejected: 1

## Findings And Disposition

1. **Critical** - Rollback đang UI-only, chưa có backend kill path.  
   Disposition: **Accepted**.  
   Applied: mandatory API/WEB flags + rollback order API first, WEB second.

2. **Critical** - Rollout gates mang tính định tính, khó quyết định go/no-go.  
   Disposition: **Accepted**.  
   Applied: hard gates (error rate, p95, conversion delta, canary duration).

3. **High** - Open question redirect homepage là blocking nhưng bị đặt non-blocking.  
   Disposition: **Accepted**.  
   Applied: khóa decision giữ redirect logged-in như hiện tại.

4. **High** - Phase 2 quá tải (core filters + facets + relevance + perf).  
   Disposition: **Accepted**.  
   Applied: v1-core only; defer relevance; facets flagged.

5. **High** - Facets có nguy cơ side-channel leak nếu scope query không đồng nhất.  
   Disposition: **Accepted**.  
   Applied: facets bắt buộc reuse RBAC-scoped where + suppress small buckets.

6. **Critical** - JSON-LD injection risk từ recruiter-controlled content.  
   Disposition: **Accepted**.  
   Applied: `safeJsonLdSerialize` + sanitize + emit only published public jobs.

7. **High** - Tracking consent chưa được operationalize.  
   Disposition: **Accepted**.  
   Applied: no-op before consent + consent tests in phase 6.

8. **High** - Raw query `q` dễ leak qua logs/events/referrer.  
   Disposition: **Accepted**.  
   Applied: no raw query logging/tracking + privacy rules.

9. **Medium** - Canonical/noindex cho query-heavy `/jobs` chưa rõ.  
   Disposition: **Accepted**.  
   Applied: canonical route clean + noindex,follow policy.

10. **High** - Thiếu owner/approver/handoff output per phase.  
    Disposition: **Accepted**.  
    Applied: added owner/approver/handoff in all phases.

11. **High** - Đề xuất bỏ toàn bộ tracking để giảm scope.  
    Disposition: **Rejected**.  
    Reason: cần tối thiểu 2 events để đo conversion effect của homepage/listing change.

## Files Updated After Review

- `plans/260310-2005-homepage-topcv-job-listing-filters/plan.md`
- `plans/260310-2005-homepage-topcv-job-listing-filters/phase-01-product-contract-ia-and-ux-guardrails.md`
- `plans/260310-2005-homepage-topcv-job-listing-filters/phase-02-api-filter-contract-v1-and-query-foundation.md`
- `plans/260310-2005-homepage-topcv-job-listing-filters/phase-03-jobs-listing-ux-filters-chips-pagination.md`
- `plans/260310-2005-homepage-topcv-job-listing-filters/phase-04-homepage-topcv-style-implementation.md`
- `plans/260310-2005-homepage-topcv-job-listing-filters/phase-05-seo-and-tracking-instrumentation-baseline.md`
- `plans/260310-2005-homepage-topcv-job-listing-filters/phase-06-testing-rollout-rollback-and-docs-sync.md`
