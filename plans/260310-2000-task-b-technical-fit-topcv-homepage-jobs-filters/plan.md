---
title: "Task B - Technical Fit Plan: TopCV Homepage + Advanced Jobs Listing"
description: "Phân tích khoảng trống kỹ thuật và đề xuất contract/query/migration/test/rollout cho homepage kiểu TopCV và trang jobs có filters nâng cao."
status: completed
priority: P1
effort: 6-8d
branch: main
tags: [research, planning, jobs, homepage, filters, api, prisma, nextjs]
created: 2026-03-10
---

# Task B - Technical Fit Plan

## Metadata

- Thời điểm research: 2026-03-10 20:00 (Asia/Bangkok).
- Scope: `apps/api` + `apps/web`, không implement code ở tài liệu này.
- Nguyên tắc: non-breaking cho route/API hiện có.

## 1) Gap Analysis (Current vs Required)

### API Layer

| Capability | Current | Required | Gap |
|---|---|---|---|
| Query contract `/jobs` | Chỉ `page/limit/search/status` | Filter đa chiều + sort + facets | Thiếu nhiều param, thiếu validate theo role, thiếu metadata response |
| Sorting | Cố định `createdAt desc` | `newest`, `relevance`, `salary_asc`, `salary_desc` | Chưa có contract sort, chưa có ranking path |
| Public listing scope | Public chỉ thấy `PUBLISHED` | Đúng, nhưng cần filter phong phú | Scope ổn, nhưng logic filter còn mỏng |
| Recruiter listing scope | Recruiter xem jobs own account | Giữ nguyên + filter nâng cao | Cần mở rộng mà không phá status filter cũ |
| Response for FE filter UI | `items + pagination` | Thêm `meta`/`facets` (optional) | Thiếu dữ liệu để render sidebar/filter chips |

### DB Layer

| Capability | Current | Required | Gap |
|---|---|---|---|
| Filter theo location/work mode | `location` lưu JSON | Query city/country/remote nhanh | JSON khó index/query ổn định |
| Filter skills | `skills` JSON array, `skillAtoms` JSON | `skillsAny/skillsAll` hiệu quả | Chưa có cột/index tối ưu cho array query |
| Search text | `contains` title/description | Search nhanh + relevance cơ bản | Chưa có trigram/FTS index |
| Pagination feed | Offset + count | Feed lớn vẫn ổn định | Thiếu composite/partial index cho pattern list thực tế |

### UI Layer

| Capability | Current | Required | Gap |
|---|---|---|---|
| Homepage | Landing đơn giản + redirect logged-in sang dashboard | Homepage kiểu TopCV (hero search, khối jobs nổi bật, CTA mạnh) | Thiếu bố cục marketing/search-first |
| Jobs listing UI | Card list đơn giản, không filter panel, không URL-state filter | Advanced listing: filter sidebar, sort, chip filter, pagination rõ ràng | Thiếu UX filter/search/sort hoàn chỉnh |
| Data binding FE | `lib/jobs-client.ts` chỉ build query đơn giản | Client typed cho full filter contract + facets | Thiếu query builder, thiếu response types mở rộng |
| Web testing | Gần như chưa có automation test cho web | E2E cho homepage/jobs filters | Thiếu harness test web |

## 2) Proposed Filter Contract v1 (`GET /jobs`)

### Query Params (v1)

- `page`:
  - int, default `1`, min `1`, max `200`.
- `limit`:
  - int, default `20`, min `1`, max `60`.
- `q`:
  - string optional, trim, min `1`, max `120`.
  - alias backward-compatible: `search` -> map vào `q`.
- `sort`:
  - enum: `newest | relevance | salary_desc | salary_asc`.
  - default: `newest`.
  - nếu `sort=relevance` nhưng `q` rỗng -> fallback `newest`.
- `employmentTypes`:
  - CSV string optional, tách mảng, tối đa 10 values, mỗi value max 50 chars.
  - so sánh case-insensitive.
- `cities`:
  - CSV string optional, tối đa 10 values, mỗi value max 80 chars.
- `remote`:
  - enum: `any | true | false`, default `any`.
- `salaryMinGte`:
  - int optional, min `0`, max `1_000_000_000`.
- `salaryMaxLte`:
  - int optional, min `0`, max `1_000_000_000`.
  - rule: nếu cùng tồn tại thì `salaryMinGte <= salaryMaxLte`.
- `skillsAny`:
  - CSV optional, tối đa 20 skills (OR logic).
- `skillsAll`:
  - CSV optional, tối đa 10 skills (AND logic).
- `postedWithinDays`:
  - enum int: `1 | 3 | 7 | 14 | 30`.
- `status`:
  - giữ param cũ để tương thích.
  - recruiter: cho phép `DRAFT|PUBLISHED|CLOSED|ARCHIVED`.
  - public/candidate: ignore/forbid, always `PUBLISHED`.
- `includeFacets`:
  - boolean optional, default `false`.

### Validation Rules

- Dùng `class-validator` + `class-transformer` như pattern hiện tại.
- Unknown params vẫn reject (`forbidNonWhitelisted: true`) để tránh query rác.
- Sanitization:
  - trim string.
  - normalize CSV -> mảng unique.
  - lower-case cho field so khớp text (`q`, `cities`, skills normalized).

### Response Shape (Backward-compatible, additive)

```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "backend-engineer-alpha",
      "title": "Backend Engineer",
      "description": "...",
      "skills": ["TypeScript", "NestJS"],
      "employmentType": "FULL_TIME",
      "salaryMin": 1800,
      "salaryMax": 2600,
      "location": { "city": "Ho Chi Minh", "country": "Vietnam", "remote": false },
      "status": "PUBLISHED",
      "publishedAt": "2026-03-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 120,
    "totalPages": 6
  },
  "meta": {
    "sort": "newest",
    "appliedFilters": {
      "q": "nestjs",
      "employmentTypes": ["FULL_TIME"],
      "cities": ["ho chi minh"],
      "remote": "any"
    }
  },
  "facets": {
    "employmentTypes": [{ "value": "FULL_TIME", "count": 80 }],
    "cities": [{ "value": "Ho Chi Minh", "count": 40 }],
    "remote": [
      { "value": "true", "count": 50 },
      { "value": "false", "count": 70 }
    ]
  }
}
```

Notes:

- `items` + `pagination` giữ nguyên để client cũ không gãy.
- `meta`, `facets` chỉ additive; `facets` trả khi `includeFacets=true`.

## 3) Prisma/Query Strategy + Indexes

### 3.1 Data-model prep (pragmatic v1)

Đề xuất thêm cột denormalized cho filter/search, giữ JSON gốc để tương thích:

- `Job.locationCity` (nullable text, normalized lowercase).
- `Job.locationCountry` (nullable text, normalized lowercase).
- `Job.isRemote` (nullable boolean).
- `Job.skillKeywords` (text[] hoặc JSON array normalized; ưu tiên `String[]` nếu Prisma/Postgres mapping ổn với stack hiện tại).

Dual-write các cột này tại `create/update/upload`.

### 3.2 Query path

- Base scope:
  - Recruiter: `recruiterId = viewer.sub`, `deletedAt IS NULL`.
  - Public/Candidate: `status = PUBLISHED`, `deletedAt IS NULL`.
- Filters:
  - `employmentTypes`: `IN`.
  - `cities`: `locationCity IN`.
  - `remote`: `isRemote = true|false`.
  - Salary overlap:
    - `salaryMax >= salaryMinGte OR salaryMax IS NULL`.
    - `salaryMin <= salaryMaxLte OR salaryMin IS NULL`.
  - Skills:
    - `skillsAny`: overlap.
    - `skillsAll`: contains all.
  - `postedWithinDays`: `publishedAt >= now - N days`.
- Sort:
  - `newest`: `publishedAt desc nulls last, createdAt desc`.
  - `salary_desc`: sort expression theo `COALESCE(salaryMax, salaryMin, 0)`.
  - `salary_asc`: sort expression theo `COALESCE(salaryMin, salaryMax, 1e9)`.
  - `relevance`: ưu tiên SQL raw có parameterized query + trigram/FTS rank; fallback `newest` nếu `q` rỗng.

### 3.3 Indexes required (PostgreSQL)

- Public feed:
  - partial/composite index cho `status`, `deletedAt`, `publishedAt DESC`.
- Recruiter feed:
  - composite index `recruiterId`, `deletedAt`, `status`, `createdAt DESC`.
- Filters:
  - index `employmentType`.
  - index `locationCity`.
  - index `isRemote`.
  - index `salaryMin`, `salaryMax`.
  - GIN index cho `skillKeywords` (nếu dùng array/json).
- Search:
  - `pg_trgm` + GIN `lower(title)` và `lower(description)` cho `q`.
  - Option nâng cấp: generated `tsvector` + GIN cho `relevance` ổn định hơn.

## 4) Migration + Compatibility Strategy

### 4.1 Non-breaking API evolution

- Không tạo endpoint mới; mở rộng `GET /jobs` hiện tại.
- Giữ `search` và `status` legacy:
  - `search` map sang `q`.
  - `status` giữ semantics cũ cho recruiter.
- Response cũ không đổi key bắt buộc.

### 4.2 DB rollout (safe)

1. Migration A:
   - thêm cột mới nullable + index.
   - chưa đổi read-path.
2. Backfill:
   - script batch cập nhật từ `location` JSON + `skills`.
   - chạy id-range chunks, có progress log.
3. Code deploy B:
   - dual-write create/update.
   - read-path mới dùng cột denormalized, fallback JSON nếu null.
4. Cleanup (optional phase 2):
   - khi tỷ lệ null thấp và metric ổn, bỏ fallback dần.

### 4.3 Feature flag / rollback

- Cờ env `JOBS_FILTERS_V1_ENABLED`.
- Nếu lỗi query/perf: tắt flag -> quay về `buildListWhere` legacy + UI hide filters nâng cao.

## 5) Test Strategy + Rollout Plan

### 5.1 API tests

- Unit (`jobs.service.spec.ts`):
  - filter matrix: city/remote/salary/skills/sort/status.
  - alias behavior: `search` -> `q`.
  - role scope behavior (public vs recruiter).
- E2E (`app.e2e-spec.ts`):
  - valid combinations trả `200`.
  - invalid params trả `400`.
  - pagination và count đúng với filter.
  - regression test route cũ `/api/jobs` không query vẫn pass.
- Perf sanity:
  - seed dataset lớn (ví dụ 50k jobs) và đo p95 cho query phổ biến.

### 5.2 Web tests

- Route-level tests cho `/jobs`:
  - URL query -> UI state hydration đúng.
  - submit filter form cập nhật URL và danh sách.
  - reload vẫn giữ filter state.
- E2E smoke homepage + jobs:
  - Hero search trên homepage chuyển đúng params sang `/jobs`.
  - sort/filter/pagination hoạt động và không mất state.

### 5.3 Rollout phases

1. `Phase 1`: DB migration + backfill + observability.
2. `Phase 2`: API contract v1 (hidden behind flag).
3. `Phase 3`: Jobs listing UI nâng cao (progressive enhancement).
4. `Phase 4`: TopCV-style homepage gắn với jobs data.
5. `Phase 5`: Canary + measure + full rollout.

Gate đề xuất:

- API: 0 regression e2e, error-rate ổn định.
- Web: smoke pass desktop/mobile.
- Perf: p95 list query đạt mục tiêu nội bộ.

## 6) Risks and Mitigations

### Security

- Risk: abuse query (`limit` cao, deep page scan, query spam).
  - Mitigation: hard cap `limit/page`, rate limit API gateway/Nest guard.
- Risk: SQL injection nếu dùng raw relevance query.
  - Mitigation: chỉ parameterized query, không string interpolation.

### Performance

- Risk: count + offset chậm ở page sâu.
  - Mitigation: cap page, composite index, cân nhắc cursor ở v2.
- Risk: `includeFacets=true` đắt khi query rộng.
  - Mitigation: facets optional, cache ngắn, query riêng/tối ưu aggregate.

### Data quality

- Risk: `employmentType/location/skills` không chuẩn hóa đồng nhất.
  - Mitigation: normalize tại write-path, backfill script, validation stricter.
- Risk: cột denormalized lệch data JSON.
  - Mitigation: dual-write + periodic consistency check job.

## Likely Files To Change

### Backend/API

- `apps/api/src/jobs/dto/query-jobs.dto.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.types.ts`
- `apps/api/src/jobs/jobs.controller.ts` (nếu cần docs/typing update)
- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/api/test/app.e2e-spec.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/<new_timestamp>_job_filters_v1/migration.sql`
- `docs/03-api-endpoints.md`

### Frontend/Web

- `apps/web/lib/jobs-client.ts`
- `apps/web/app/jobs/page.tsx`
- `apps/web/app/page.tsx`
- `apps/web/components/jobs/jobs-filter-form.tsx` (new)
- `apps/web/components/jobs/jobs-sort-select.tsx` (new)
- `apps/web/components/jobs/jobs-facet-sidebar.tsx` (new)
- `apps/web/components/jobs/jobs-pagination.tsx` (new)
- `apps/web/components/jobs/job-listing-card.tsx` (new/refactor)
- `apps/web/docs/job-management-smoke-checklist.md` (mở rộng checklist public/jobs filters)

## Evidence Snapshot (Current Code)

- Query DTO hiện chỉ có `page/limit/search/status`: `apps/api/src/jobs/dto/query-jobs.dto.ts`.
- Jobs list service currently order by `createdAt desc` + where đơn giản: `apps/api/src/jobs/jobs.service.ts`.
- `Job` schema hiện location/skills chủ yếu ở JSON, index còn basic: `apps/api/prisma/schema.prisma`.
- FE jobs client chưa có advanced filters: `apps/web/lib/jobs-client.ts`.
- FE `/jobs` page chưa có filter/sort UI: `apps/web/app/jobs/page.tsx`.
- FE homepage hiện minimal landing + redirect logged-in: `apps/web/app/page.tsx`.

## Unresolved Questions

- Có giữ redirect logged-in khỏi homepage không, hay cho phép vào homepage để search jobs ngay?
- Có cần “company profile” thật (logo, industry, size) cho kiểu TopCV, hay tạm dùng recruiter info?
- Chuẩn enum `employmentType` chính thức cho UI/DB (FULL_TIME/PART_TIME/CONTRACT/HYBRID...) là gì?
- Mục tiêu p95 cụ thể cho `/jobs` filter query ở production là bao nhiêu để chốt index strategy?
