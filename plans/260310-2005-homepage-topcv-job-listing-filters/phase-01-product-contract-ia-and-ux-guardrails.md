# Phase 01: Product Contract, IA, and UX Guardrails

## Context Links

- Parent: [plan.md](./plan.md)
- Research:
  - [UX blueprint report](../reports/researcher-260310-ux-product-blueprint-homepage-job-listing-mvp.md)
  - [Technical fit report](../260310-2000-task-b-technical-fit-topcv-homepage-jobs-filters/plan.md)
- Baseline files:
  - `../../apps/web/app/page.tsx`
  - `../../apps/web/app/jobs/page.tsx`

## Overview

- Priority: P1
- Status: In Progress
- Estimate: 5h
- Owner: FE Lead + PM
- Approver: Product Owner
- Handoff Output: `reports/ux-contract.md`, `reports/filter-priority-matrix.md`, `reports/event-taxonomy-v1.md`
- Goal: khóa scope rõ ràng, tránh over-design, thống nhất IA + behavior trước khi sửa API/UI.

## Key Insights

- Current `/jobs` đã có card + apply-entry nhưng thiếu filter/sort/url-state.
- Homepage hiện tại chỉ là landing đơn giản, chưa phải acquisition page.
- Nếu không lock contract sớm, team dễ lẫn giữa candidate use-case và recruiter/admin use-case.

## Requirements

Functional:

- Chốt IA homepage guest-first: hero search, featured jobs, how-it-works, CTA cuối.
- Chốt IA jobs list: search/filter/sort/result/pagination/empty/error.
- Chốt filter priority v1 vs later.
- Chốt event funnel names cho candidate discovery/apply.
- Chốt 3 quyết định blocking trước khi sang phase 2/4:
  - Redirect logged-in khỏi `/` giữ nguyên ở v1.
  - Trust strip dùng copy trung tính (không số liệu chưa xác thực).
  - `employmentType` v1 dùng normalized free-text mapping (không enum cứng).

Non-functional:

- Tuân thủ KISS, không vượt scope MVP.
- Tài liệu đủ rõ để dev junior implement.
- Áp dụng design budget cứng:
  - homepage max 6 sections
  - không token mới
  - không auto-carousel.

## Architecture

`Discovery -> UX Contract -> API Contract Alignment -> Build`

Deliverable contract cho phase sau:

- `filter state model`
- `query param canonical rules`
- `component ownership` (server vs client)
- `event taxonomy`

## Related Code Files

Modify:

- `plans/260310-2005-homepage-topcv-job-listing-filters/plan.md` (nếu cần refine sau lock)

Create:

- `plans/260310-2005-homepage-topcv-job-listing-filters/reports/ux-contract.md`
- `plans/260310-2005-homepage-topcv-job-listing-filters/reports/filter-priority-matrix.md`

## Implementation Steps

1. Tổng hợp user journey: guest -> jobs list -> job detail -> apply.
2. Chốt IA block-level cho homepage và jobs listing.
3. Chốt filter matrix v1:
   - Must: `q/search`, `employmentTypes`, `remote`, `postedWithinDays`, `sort`, `reset`.
   - Later: `skills`, `city`, saved filters, alerts.
4. Chốt UX rules mobile:
   - filter drawer/bottom sheet
   - sticky apply/reset controls
   - URL sync behavior.
5. Chốt event contract v1 (name + payload fields).
6. Ghi rõ owner/approver cho từng artifact trong phase.

## Todo List

- [ ] IA homepage approved.
- [ ] IA jobs listing approved.
- [ ] Filter priority matrix approved.
- [ ] Event naming contract approved.
- [x] Blocking decisions approved.
- [x] Scope boundaries documented.

## Success Criteria

- Không còn ambiguity về scope trước khi sang API/UI implementation.
- Mọi phase sau bám cùng contract, không tự mở rộng scope.

## Risk Assessment

- Risk: stakeholder muốn thêm nhiều feature “TopCV-like” vượt MVP.
- Mitigation: explicit “Now vs Later” matrix.

## Security Considerations

- Không dùng copy gây hiểu nhầm về AI matching quality.
- Không lộ dữ liệu nội bộ trong trust metrics.

## Next Steps

- Bắt đầu Phase 2 để khóa API contract + validation rules.
