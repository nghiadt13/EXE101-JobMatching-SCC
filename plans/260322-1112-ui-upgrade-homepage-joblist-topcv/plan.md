---
title: "UI Upgrade: Homepage TopCV Sections + Job List Page"
description: "Add TopCV-inspired sections to homepage and build a new Job List page with sidebar filters matching TopCV design."
status: in-progress
priority: P1
effort: 16h
branch: main
tags: [frontend, ui, homepage, jobs, topcv, filters]
created: 2026-03-22
last-updated: 2026-03-22
blockedBy: []
blocks: []
---

# UI Upgrade: Homepage TopCV Sections + Job List Page

## Overview

Upgrade the HireStream frontend with two major UI improvements inspired by TopCV:

1. **Homepage**: Add new sections (Top Employers, Why Choose Us, Career Blog, CTA Banner) to make the homepage richer and more engaging.
2. **Job List Page**: Create a dedicated `/jobs/list` page with a left sidebar filter panel and TopCV-style horizontal job cards.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Homepage new sections (Top Employers, Why Choose Us, Blog, CTA) | In Progress | 6h | [phase-01](./phase-01-homepage-new-sections.md) |
| 2 | Job List page with sidebar filters and TopCV cards | Pending | 8h | [phase-02-job-list-page-sidebar-filters.md](./phase-02-job-list-page-sidebar-filters.md) |
| 3 | Polish, responsive, and verification | Pending | 2h | [phase-03](./phase-03-polish-responsive-verification.md) |

## Dependencies

- Phase 2 can start independently of Phase 1.
- Phase 3 depends on Phases 1-2.

## Files Impacted

Homepage:
- `apps/web/components/home/homepage-main.tsx`
- `apps/web/app/globals.css`

Job List Page:
- `apps/web/app/jobs/list/page.tsx` (new)
- `apps/web/components/jobs/job-list-client.tsx` (new)
- `apps/web/components/jobs/job-list-sidebar.tsx` (new)
- `apps/web/components/jobs/job-list-card.tsx` (new)
- `apps/web/lib/routes.ts`

## Verification

- `npm run lint -w web`
- `npm run build -w web`
- Manual browser verification at `localhost:3000` and `localhost:3000/jobs/list`
