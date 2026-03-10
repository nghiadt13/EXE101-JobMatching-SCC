# Phase 04: Homepage TopCV-Style Implementation

## Context Links

- Parent: [plan.md](./plan.md)
- Dependency: [phase-01](./phase-01-product-contract-ia-and-ux-guardrails.md)
- Relevant files:
  - `../../apps/web/app/page.tsx`
  - `../../apps/web/app/layout.tsx`
  - `../../apps/web/components/ui/*`

## Overview

- Priority: P1
- Status: Completed
- Estimate: 6h
- Owner: FE Lead
- Approver: Product Owner
- Handoff Output: homepage sections + hero search + featured jobs integrated
- Goal: thay homepage thành acquisition page “TopCV-like”, ưu tiên search và lead user vào jobs.

## Key Insights

- Existing homepage chỉ là auth gateway đơn giản.
- TopCV-style phù hợp nhất ở thông điệp và cấu trúc section, không cần copy visual 1:1.
- Redirect logged-in khỏi `/` đã lock giữ nguyên cho v1.

## Requirements

Functional:

- Homepage sections:
  - nav + CTA
  - hero + keyword search
  - trust strip nhẹ
  - featured jobs preview
  - how-it-works
  - final CTA.
- Hero search submit về `/jobs?q=...`.
- Featured jobs lấy từ `getJobs({ page: 1, limit: N })` public scope.
- Bám design budget: tối đa 6 sections, không token mới, không auto-carousel.

Non-functional:

- Responsive desktop/mobile tốt.
- Tránh nặng media/animation.
- Không phá redirect flow cho logged-in.

## Architecture

- `app/page.tsx` vẫn là server component.
- Data fetch cho featured jobs từ API client hiện có.
- Reuse job card mini component để giảm duplication với `/jobs`.

## Related Code Files

Modify:

- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

Create:

- `apps/web/components/jobs/home-hero-search.tsx`
- `apps/web/components/jobs/home-featured-jobs.tsx`
- `apps/web/components/jobs/home-how-it-works.tsx`

## Implementation Steps

1. Chốt copy blocks theo search intent tuyển dụng.
2. Tạo hero search form và connect query to `/jobs`.
3. Render featured jobs preview (5-8 items).
4. Add “how it works” block bám flow thật: register -> upload CV -> apply.
5. Add final CTA and secondary nav actions.
6. Add referrer policy phù hợp ở layout để giảm leak query search.
7. Validate mobile spacing/type scale.

## Todo List

- [x] Hero + search block done.
- [x] Featured jobs block done.
- [x] How-it-works block done.
- [x] CTA footer block done.
- [x] Design budget constraints passed.
- [x] Responsive checks pass.

## Success Criteria

- Guest mở `/` hiểu ngay hành động chính là tìm việc.
- Hero search đưa user vào `/jobs` với query đúng.
- Homepage visual có hierarchy rõ, không “AI slop”.

## Risk Assessment

- Risk: trùng lặp nhiều card styles giữa home và jobs list.
- Mitigation: tách card primitives dùng chung.

## Security Considerations

- Không render dữ liệu private/recruiter-only trong featured block.
- Không claim số liệu trust khi chưa có nguồn xác thực.
- Không log query search từ homepage dưới dạng raw text.

## Next Steps

- Phase 5 thêm SEO + tracking để đo conversion funnel.

