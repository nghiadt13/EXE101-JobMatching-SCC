---
title: "Homepage TopCV-Style + Advanced Job Listing Plan"
description: "Thiết kế homepage kiểu TopCV và nâng cấp trang jobs với filter/sort/url-state, giữ tương thích flow apply hiện tại."
status: in-progress
priority: P1
effort: 38h
issue: null
branch: main
tags: [feature, frontend, backend, api, jobs, seo]
created: 2026-03-10
---

# Homepage TopCV-Style + Advanced Job Listing Plan

## Overview

Mục tiêu: thay landing page hiện tại bằng homepage kiểu job marketplace (hướng TopCV) và nâng cấp `/jobs` thành trang listing mạnh hơn với filter/sort/pagination rõ ràng.

Ràng buộc chính:

- Không phá flow apply đang chạy ở `/jobs/[slug]`.
- Không phá contract cũ `GET /jobs?page&limit&search&status`.
- Ưu tiên thay đổi additive, có rollback nhanh bằng backend + frontend feature flags bắt buộc.

Phạm vi include:

- Homepage mới cho guest (section-driven, search-first).
- Jobs listing mới có filter UX desktop/mobile.
- Mở rộng API filter/sort tối thiểu cho v1.
- SEO cơ bản (metadata, sitemap/robots, JSON-LD chính).
- Test + smoke + rollout checklist.

Phạm vi exclude:

- Không làm saved jobs, alert jobs, recommendation AI, company profile đầy đủ.
- Không thay đổi business rules apply/candidate/recruiter.

## Research Inputs

- UX/Product report: [researcher-260310-ux-product-blueprint-homepage-job-listing-mvp.md](../reports/researcher-260310-ux-product-blueprint-homepage-job-listing-mvp.md)
- Technical fit report: [task-b technical fit plan](../260310-2000-task-b-technical-fit-topcv-homepage-jobs-filters/plan.md)
- Baseline code:
  - `apps/web/app/page.tsx`
  - `apps/web/app/jobs/page.tsx`
  - `apps/web/lib/jobs-client.ts`
  - `apps/api/src/jobs/dto/query-jobs.dto.ts`
  - `apps/api/src/jobs/jobs.service.ts`

## Phase Plan

| # | Phase | Status | Effort | Owner | Link |
|---|-------|--------|--------|-------|------|
| 1 | Product contract, IA, and UX guardrails | In Progress | 5h | FE Lead + PM | [phase-01](./phase-01-product-contract-ia-and-ux-guardrails.md) |
| 2 | API filter contract v1 and query foundation | In Progress | 10h | BE Lead | [phase-02](./phase-02-api-filter-contract-v1-and-query-foundation.md) |
| 3 | Jobs listing UX (filters, chips, pagination) | In Progress | 9h | FE Lead | [phase-03](./phase-03-jobs-listing-ux-filters-chips-pagination.md) |
| 4 | Homepage TopCV-style implementation | Completed | 6h | FE Lead | [phase-04](./phase-04-homepage-topcv-style-implementation.md) |
| 5 | SEO + tracking instrumentation baseline | Completed | 3h | FE Lead + SEO owner | [phase-05](./phase-05-seo-and-tracking-instrumentation-baseline.md) |
| 6 | Testing, rollout, rollback, and docs sync | In Progress | 5h | QA Lead + BE/FE Leads | [phase-06](./phase-06-testing-rollout-rollback-and-docs-sync.md) |

## Dependency Graph

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phase 1 and shared job-card primitives from Phase 3.
- Phase 5 depends on Phases 3-4.
- Phase 6 depends on Phases 2-5.

## API Contract Strategy (Non-Breaking)

`GET /jobs` giữ tương thích contract hiện tại và mở rộng additive:

- Keep: `page`, `limit`, `search`, `status`.
- Add v1-core: `q`, `sort`, `employmentTypes`, `remote`, `salaryMinGte`, `salaryMaxLte`, `postedWithinDays`.
- Add v1-optional (guarded): `includeFacets`.
- Alias: `search` -> `q` khi `q` chưa được truyền.
- Public/Candidate: luôn enforce `status=PUBLISHED`.
- Recruiter: vẫn dùng `status` như hiện tại cho own list.
- `relevance` sort defer sau v1-core; v1 chỉ ship `newest`, `salary_asc`, `salary_desc`.

Response giữ `items`, `pagination`; thêm `meta` và `facets` theo chế độ opt-in.

Feature flags bắt buộc:

- `API_JOBS_FILTERS_V1_ENABLED`
- `API_JOBS_FACETS_V1_ENABLED`
- `WEB_JOBS_FILTERS_V1_ENABLED`
- `WEB_HOME_TOPCV_V1_ENABLED`
- `WEB_TRACKING_V1_ENABLED`

## Definition Of Done

- Homepage mới thay cho landing cũ, có CTA tìm việc rõ ràng.
- `/jobs` có keyword search + filter/sort cơ bản + URL state + mobile filter drawer.
- API `/jobs` hỗ trợ filter/sort v1 theo contract mới nhưng không breaking client cũ.
- Apply flow ở `/jobs/[slug]` không regression.
- SEO baseline hoàn chỉnh: metadata route-specific, `sitemap.ts`, `robots.ts`, JSON-LD tối thiểu.
- API/Web tests quan trọng pass; smoke checklist cập nhật.
- Rollout gates đạt ngưỡng định lượng:
  - `/jobs` p95 <= 350ms (canary dataset chuẩn), error rate < 1%.
  - Conversion `jobs_list_view -> job_detail_view` giảm không quá 5% so baseline 7 ngày.
  - Canary chạy tối thiểu 24h trước full rollout.

## Risks

- Query filter mới gây chậm khi dataset lớn.
- Scope homepage/listing dễ trôi thành redesign lớn.
- Tracking event thiếu chuẩn làm nhiễu đo lường.
- Filter UI mobile dễ nặng JS nếu lạm dụng client state.

## Mitigation

- Ra contract v1 tối giản; thêm filter theo giá trị thật sự cần.
- Thêm backend kill-switch theo từng behavior (`filters`, `facets`, `tracking`) thay vì rollback UI-only.
- Chốt IA + copy + component boundaries từ Phase 1.
- Dùng tracking tối giản (2 events cốt lõi), consent-gated, không gửi raw query.
- Giữ SSR-first cho list data; client chỉ giữ state filter UI.

## Design Budget (Hard Limit)

- Homepage tối đa 6 sections.
- Không thêm design token mới ở v1.
- Không thêm animation ngoài transition cơ bản.
- Không thêm carousel tự động.

## Blocking Decisions Locked For This Plan

- Giữ redirect logged-in khỏi `/` (hành vi hiện tại) cho v1 để tránh đụng flow dashboard.
- Trust strip v1 dùng copy trung tính, không hiển thị số liệu chưa xác thực.
- `employmentType` v1 dùng normalized free-text mapping (uppercase + trim), không khóa enum cứng.

## Red Team Review

- Reviewers: 4 lenses (Security, Failure Modes, Assumption, Scope/Critique).
- Total findings raw: 32.
- Deduplicated findings: 11.
- Accepted: 10.
- Rejected: 1 (đề xuất bỏ hẳn tracking v1; giữ lại bản tối giản 2 events vì cần baseline đo hiệu quả).

Accepted changes reflected in this plan:

- Feature flags bắt buộc cho backend và frontend; rollback không còn UI-only.
- Rollout gates chuyển thành định lượng (error rate, p95, conversion delta, canary duration).
- `relevance` sort defer khỏi v1-core; `facets` guarded bằng flag riêng.
- Facets bắt buộc reuse đúng RBAC scope và suppress bucket nhỏ.
- Bổ sung test matrix boundary/timezone/cardinality/preference precedence.
- Bổ sung privacy rules cho `q` (không log raw, không gửi raw vào tracking).
- Bổ sung JSON-LD hardening (`safeJsonLdSerialize`) và emit policy cho public published jobs.
- Bổ sung canonical/noindex policy cho `/jobs` query-heavy URLs.
- Chuyển open questions quan trọng thành blocking decisions đã khóa.
- Thêm owner/approver/handoff output cho từng phase.

## Validation Log

- Date: 2026-03-10
- Mode: Auto validation (no user interview in this turn)
- Decisions validated:
  - Scope remains MVP-first, không mở rộng sang saved jobs/alerts/company profile.
  - Redirect logged-in ở homepage giữ nguyên cho v1 để giảm regression auth-flow.
  - Tracking v1 giữ tối giản 2 events, consent-gated, no raw query payload.
  - API v1 ship core filters trước; facets/relevance chỉ bật khi perf gates đạt.
