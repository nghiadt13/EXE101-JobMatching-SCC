# Phase 03: Jobs Listing UX (Filters, Chips, Pagination)

## Context Links

- Parent: [plan.md](./plan.md)
- Dependency: [phase-02](./phase-02-api-filter-contract-v1-and-query-foundation.md)
- Relevant files:
  - `../../apps/web/app/jobs/page.tsx`
  - `../../apps/web/lib/jobs-client.ts`
  - `../../apps/web/components/ui/*`
  - `../../apps/web/components/auth/dashboard-shell.tsx`

## Overview

- Priority: P1
- Status: In Progress
- Estimate: 9h
- Owner: FE Lead
- Approver: Tech Lead
- Handoff Output: `/jobs` UX + query-state contract + shared job card primitive
- Goal: biến `/jobs` thành listing page giống job board hiện đại, rõ filter behavior, mobile usable.

## Key Insights

- Current page render list đơn giản, chưa có query-param-driven UI state.
- Candidate route continuity với `DashboardShell` cần giữ nguyên.
- Nếu filter state không sync URL sẽ hỏng back/forward/share link.

## Requirements

Functional:

- Jobs list có sections:
  - page header + result count
  - search + filter controls
  - active filter chips
  - sort selector
  - list cards
  - pagination controls.
- Mobile filter drawer/bottom sheet với `Apply` + `Reset`.
- Preserve CTA `View details and apply` -> `/jobs/[slug]`.
- Preserve role-aware shell behavior cho candidate.
- Gating bằng `WEB_JOBS_FILTERS_V1_ENABLED` để rollback UI nhanh.

Non-functional:

- SSR-first data fetch theo URL query.
- Client state chỉ cho interactive controls.
- Component chia nhỏ, tránh page monolith.

## Architecture

- Server component page đọc `searchParams` canonical -> call `getJobs(query)`.
- Client filter form phát sinh URL query mới bằng navigation replace/push.
- Shared serializer/deserializer cho query model tại `lib/jobs-client.ts` hoặc `lib/jobs-query.ts`.
- Tách `job-listing-card` dùng chung cho `/jobs` và homepage featured list.

## Related Code Files

Modify:

- `apps/web/app/jobs/page.tsx`
- `apps/web/lib/jobs-client.ts`
- `apps/web/lib/navigation.ts` (nếu cần active matching cải tiến cho query)

Create:

- `apps/web/components/jobs/jobs-filter-form.tsx`
- `apps/web/components/jobs/jobs-sort-select.tsx`
- `apps/web/components/jobs/jobs-active-filters.tsx`
- `apps/web/components/jobs/jobs-pagination.tsx`
- `apps/web/components/jobs/job-listing-card.tsx`

## Implementation Steps

1. Define query model type ở web tương ứng API v1.
2. Build parsing helper:
   - URL -> typed query state
   - typed state -> URL query.
3. Trích xuất `job-listing-card` primitive trước khi refactor layout.
4. Refactor page layout từ list đơn sang structured listing.
5. Build desktop filter bar + active chips + clear all.
6. Build mobile filter drawer với pending state trước khi apply.
7. Implement pagination preserving filter/sort query.
8. Ensure empty state hiển thị theo context filter.
9. Verify role branches (candidate shell vs public layout) không regression.

## Todo List

- [x] Query state parser/serializer done.
- [x] Shared job-listing-card primitive done.
- [x] Desktop filter UX done.
- [ ] Mobile filter UX done.
- [x] Active chips/reset done.
- [x] Pagination + URL sync done.
- [x] Empty/error states done.

## Success Criteria

- User có thể share URL `/jobs?...` và mở lại đúng state.
- Back/forward trình duyệt giữ đúng filter state.
- Mobile flow filter thao tác 1 tay, không mất state bất ngờ.
- Feature flag off -> tự động fallback về layout `/jobs` legacy.

## Risk Assessment

- Risk: filter UI nhiều controls gây rối.
- Mitigation: v1 chỉ giữ controls có giá trị cao nhất, defer advanced filters.

## Security Considerations

- Escape/sanitize values khi echo query lên UI text.
- Không expose recruiter-only filters cho public scope.
- Không hiển thị raw query dài/nhạy cảm trên title/subtitle UI.

## Next Steps

- Phase 4 triển khai homepage mới và nối hero search vào `/jobs`.

