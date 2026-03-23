# Phase 2: Job List Page with Sidebar Filters

## Context Links

- Related plan: [plan.md](./plan.md)
- Reference: TopCV job listing screenshot
- Relevant files:
  - `../../apps/web/components/jobs/jobs-listing-page.tsx`
  - `../../apps/web/components/jobs/jobs-filter-form.tsx`
  - `../../apps/web/components/jobs/job-listing-card.tsx`
  - `../../apps/web/lib/jobs-client.ts`
  - `../../apps/web/lib/routes.ts`

## Overview

- Priority: P1
- Status: Pending
- Brief: Create a new Job List page at `/jobs/list` with a TopCV-style 2-column layout: left sidebar filters + right job card list.

## Layout

```
┌──────────────────────────────────────────────────┐
│ SiteHeader                                        │
├──────────────────────────────────────────────────┤
│ Breadcrumb + keyword suggestion pills             │
├──────────────┬───────────────────────────────────┤
│  Sidebar     │ Search bar + Sort/Tab bar          │
│  Filters     ├───────────────────────────────────┤
│              │ Job Card (horizontal, TopCV-style) │
│  • Category  │ [Logo] [Title + Company + Tags]    │
│  • Type      │        [Location] [Salary] [♡]     │
│  • Customer  │                                    │
│  • Experience│ Job Card 2 ...                     │
│  • Location  │ Job Card 3 ...                     │
│              ├───────────────────────────────────┤
│  [Reset]     │ Pagination                         │
├──────────────┴───────────────────────────────────┤
│ Footer                                            │
└──────────────────────────────────────────────────┘
```

## Sidebar Filter Categories

1. **Lọc theo danh mục nghề** (Category checkboxes): Sales, IT, Marketing, Admin, Service
2. **Hình thức kinh doanh** (Business type radio): Tất cả, Direct Sales, Telesales, Online Sales
3. **Đối tượng khách hàng** (Customer type radio): Tất cả, B2B, B2C, B2G
4. **Kinh nghiệm** (Experience radio): Tất cả, Không yêu cầu, Dưới 1 năm, 1 năm, 2 năm, 3 năm
5. **Xóa lọc** (Reset) button

## New Files

- `apps/web/app/jobs/list/page.tsx` – Server component page
- `apps/web/components/jobs/job-list-client.tsx` – Main client component
- `apps/web/components/jobs/job-list-sidebar.tsx` – Sidebar filter panel
- `apps/web/components/jobs/job-list-card.tsx` – TopCV-style horizontal job card

## Modified Files

- `apps/web/lib/routes.ts` – Add JOB_LIST_ROUTE constant
- `apps/web/app/globals.css` – Add job-list-card styles

## Implementation Steps

1. Create route `/jobs/list` with server component
2. Build `JobListSidebar` with all filter groups (checkboxes/radios)
3. Build `JobListCard` with horizontal layout matching TopCV
4. Build `JobListClient` assembling sidebar + card list + search/sort bar + pagination
5. Add keyword suggestion pills at top
6. Connect filters to URL search params
7. Style with CSS classes in globals.css

## Todo List

- [ ] Create `/jobs/list/page.tsx` server page
- [ ] Build `JobListSidebar` component
- [ ] Build `JobListCard` component
- [ ] Build `JobListClient` component
- [ ] Add breadcrumb + keyword pills
- [ ] Add search/sort bar with tabs
- [ ] Connect filters to URL params
- [ ] Add pagination
- [ ] Update `routes.ts`
- [ ] Add CSS styles

## Success Criteria

- Page renders at `/jobs/list` with the 2-column layout
- Sidebar filters visually match TopCV style
- Job cards display company logo, title, salary, location, tags
- Filters update URL params and refetch jobs
- Pagination works correctly
