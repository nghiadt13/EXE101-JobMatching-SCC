---
title: "FE Plan: Render Normalized Arrays (CV + JD)"
description: "Refactor frontend to render full normalizedProfile arrays (experience, education, certifications, projects, languages, requirements/benefits) instead of only skills/summary."
status: completed
priority: P1
effort: 10h
issue: "Current FE only shows skills/summary, losing most parsed structure from AI normalization"
branch: main
tags: [frontend, cv, jobs, normalized-profile, ux]
created: 2026-03-06
---

# FE Plan: Render Normalized Arrays (CV + JD)

## Overview

Mục tiêu: FE hiển thị đầy đủ dữ liệu `normalizedProfile` dạng mảng cho cả Candidate CV và Recruiter Job, không còn giới hạn ở `skills` + `summary`.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Contract audit + FE shape mapping | Completed | 2h | [phase-01](./phase-01-contract-audit-fe-shape-mapping.md) |
| 2 | Candidate CV arrays rendering + edit UX | Completed | 3h | [phase-02](./phase-02-candidate-cv-arrays-rendering-edit-ux.md) |
| 3 | Recruiter Job arrays rendering + edit UX | Completed | 3h | [phase-03](./phase-03-recruiter-job-arrays-rendering-edit-ux.md) |
| 4 | Shared components polish + validation + docs | Completed | 2h | [phase-04](./phase-04-shared-components-validation-docs.md) |

## Dependencies

- Phase 2 and Phase 3 depend on Phase 1.
- Phase 4 depends on Phase 2 and Phase 3.

## Definition Of Done

- Candidate CV page hiển thị được:
  - `experience[]`, `education[]`, `certifications[]`, `projects[]`, `languages[]`, `skills[]`, `summary`.
- Recruiter Job pages hiển thị được:
  - `skills[]`, `jobMeta.requirements[]`, `jobMeta.benefits[]`, `summary`.
- UI có trạng thái parse rõ ràng (`parsed_ok`, `fallback`, `needs_review`).
- Editing flow vẫn đơn giản (MVP): có thể chỉnh lại text/array cơ bản rồi save.
- Web lint + build pass.

## Risks

- Payload không đồng nhất giữa records cũ/mới (missing keys).
- UI quá rối nếu hiển thị raw JSON trực tiếp.
- Server action parse form array sai format.

## Mitigation

- Tạo adapter normalize-on-read ở FE client.
- Dùng component hiển thị mảng dùng chung (`section title + chips/list`).
- Parse array theo quy tắc rõ ràng (newline/comma) và có fallback empty.

## Unresolved Questions

- None.
