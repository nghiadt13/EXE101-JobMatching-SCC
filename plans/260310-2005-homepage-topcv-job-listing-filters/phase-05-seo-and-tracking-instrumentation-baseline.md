# Phase 05: SEO and Tracking Instrumentation Baseline

## Context Links

- Parent: [plan.md](./plan.md)
- Dependencies:
  - [phase-03](./phase-03-jobs-listing-ux-filters-chips-pagination.md)
  - [phase-04](./phase-04-homepage-topcv-style-implementation.md)
- Relevant files:
  - `../../apps/web/app/layout.tsx`
  - `../../apps/web/app/page.tsx`
  - `../../apps/web/app/jobs/page.tsx`
  - `../../apps/web/app/jobs/[slug]/page.tsx`

## Overview

- Priority: P2
- Status: Completed
- Estimate: 3h
- Owner: FE Lead + SEO Owner
- Approver: Tech Lead
- Handoff Output: SEO artifacts + 2 tracked funnel events + security checklist
- Goal: có baseline SEO indexable và funnel telemetry tối thiểu để đo hiệu quả homepage/jobs.

## Key Insights

- Metadata global hiện rất generic, chưa route-specific.
- Chưa có `sitemap.ts` và `robots.ts` cho crawling control.
- Chưa có event contract đo conversion guest -> apply.

## Requirements

Functional:

- Route metadata riêng cho `/`, `/jobs`, `/jobs/[slug]`.
- Add `app/sitemap.ts`, `app/robots.ts`.
- Add JSON-LD:
  - Homepage: `WebSite`
  - Jobs detail: `JobPosting`.
- Add tracking v1 tối giản với 2 events:
  - `home_search_submitted`
  - `apply_attempted`
- Gating bằng `WEB_TRACKING_V1_ENABLED`.

Non-functional:

- Tracking off by default nếu chưa có consent.
- Không block UI khi gửi event.

## Architecture

- Metadata nằm ở route-level exports.
- Tracking utilities tại web `lib/analytics/*` theo no-op by default.
- Canonical policy:
  - `/jobs` canonical luôn về route sạch
  - query-heavy pages set `noindex,follow`.

## Related Code Files

Modify:

- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/jobs/page.tsx`
- `apps/web/app/jobs/[slug]/page.tsx`

Create:

- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`
- `apps/web/lib/analytics/events.ts`
- `apps/web/lib/analytics/track.ts`

## Implementation Steps

1. Define metadata strategy per route.
2. Implement sitemap/robots theo public routes only.
3. Inject JSON-LD blocks ở homepage và job detail.
4. Implement `safeJsonLdSerialize()` để escape payload nguy hiểm (`<`, `>`, `&`, U+2028, U+2029).
5. Emit `JobPosting` JSON-LD chỉ khi job public `PUBLISHED`; non-public skip JSON-LD + `noindex`.
6. Implement tracking no-op by default + consent-gated.
7. Emit 2 events v1: `home_search_submitted`, `apply_attempted`.

## Todo List

- [x] Metadata route-specific done.
- [x] Sitemap/robots done.
- [x] JSON-LD done.
- [x] Safe JSON-LD serialization done.
- [x] Consent-gated tracking done.
- [x] 2 core events emitted.

## Success Criteria

- SEO crawler thấy public routes rõ ràng, metadata đúng intent.
- Có dữ liệu event tối thiểu để tính conversion funnel.
- Không có event nào được gửi trước consent.

## Risk Assessment

- Risk: tracking spam hoặc leak dữ liệu nhạy cảm.
- Mitigation: payload whitelist, no PII in event props.

## Security Considerations

- Không gửi email/userId/raw query nhạy cảm trong tracking payload.
- Consent check bắt buộc trước khi emit non-essential events.
- Không chèn raw recruiter text vào JSON-LD khi chưa sanitize.

## Next Steps

- Sang Phase 6 để test + rollout.

