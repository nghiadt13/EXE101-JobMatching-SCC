---
title: "CV Builder + AI CV Suggestion (OpenResume Reference)"
description: "Build a TopCV-style CV builder with split-screen form/preview, 3 templates, PDF export, and AI-powered suggestion for job-specific CV improvement."
status: in_progress
priority: P1
effort: 32h
issue: null
branch: main
tags: [feature, backend, frontend, cv, ai, pdf, builder]
created: 2026-03-22
reference: "https://github.com/xitanggg/open-resume (MIT)"
---

# CV Builder + AI CV Suggestion

## Overview

Xây dựng CV Builder giống TopCV: chọn mẫu → điền form → live preview → lưu/tải PDF, tích hợp AI gợi ý cải thiện CV theo từng JD. Tham khảo [OpenResume](https://github.com/xitanggg/open-resume) (MIT).

Hiện tại hệ thống chỉ hỗ trợ upload CV (PDF/DOCX) → AI parse. Feature mới bổ sung:
1. **CV Builder**: tạo/chỉnh sửa CV trực tiếp trên web, xuất PDF
2. **AI CV Suggestion**: AI phân tích CV + JD → gợi ý cải thiện nội dung

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Prisma schema + Backend CV Builder API | Not Started | 8h | [phase-01](./phase-01-prisma-schema-backend-cv-builder-api.md) |
| 2 | Frontend CV Builder UI (form + preview + templates) | Not Started | 16h | [phase-02](./phase-02-frontend-cv-builder-ui.md) |
| 3 | Backend AI CV Suggestion service | Done | 4h | [phase-03](./phase-03-backend-ai-cv-suggestion.md) |
| 4 | Frontend AI Suggestion panel + Polish | Done | 4h | [phase-04](./phase-04-frontend-ai-suggestion-polish.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 1 (needs CV + Job data access).
- Phase 4 depends on Phase 2 + 3.

## Definition Of Done

- Candidate can create a CV from scratch via split-screen builder (form + live preview).
- Candidate can choose from 3 templates (Simple, Professional, Modern).
- Builder CV is saved to DB and compatible with existing matching pipeline.
- Candidate can download CV as PDF.
- Candidate can edit builder CV and see real-time preview changes.
- AI suggestion panel analyzes CV vs a specific JD and gives actionable improvements.
- Existing CV upload flow continues to work unchanged.
- API lint/test/build and web lint/build pass.

## Risks

- `@react-pdf/renderer` SSR compatibility with Next.js 16 (needs `"use client"` + dynamic import).
- Builder CV rawText generation quality affects matching accuracy.
- AI suggestion LLM cost per request.

## Mitigation

- Use dynamic import (`next/dynamic`) with `ssr: false` for all react-pdf components.
- Generate rawText by structured concatenation following same format as uploaded CV text.
- Rate-limit AI suggestion endpoint (1 request per CV per job per hour).

## Reference Architecture (OpenResume Mapping)

```text
OpenResume                          →  Project
────────────────────────────────       ────────────────────────────────
Redux store (client state)          →  React useState + API (NestJS)
localStorage persistence            →  PostgreSQL (CV table)
No backend                          →  POST/PUT /api/cvs/create|builder
1 fixed template                    →  3 CSS templates
No AI                               →  AI CV Suggestion (Gemini)
ResumeForm/ (6 section forms)       →  components/cv/builder/sections/
Resume/ResumePDF/ (react-pdf)       →  components/cv/builder/pdf/
```
