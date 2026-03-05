---
title: "CV Management Plan (Upload + Parsing + Primary + Security)"
description: "Implement candidate CV upload/list/detail/update/delete/set-primary with PDF/DOCX parsing and security guards."
status: in_progress
priority: P1
effort: 14h
issue: null
branch: main
tags: [feature, backend, frontend, cv, ai, security]
created: 2026-03-05
---

# CV Management Plan (Upload + Parsing + Primary + Security)

## Overview

Feature tie to checklist Day 6-7: CV upload flow, text extraction, Gemini parsing, candidate CV pages, and upload abuse protections.
Scope MVP only, localhost only, synchronous parsing on upload.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | CV contract and upload security baseline | Completed | 2h | [phase-01](./phase-01-cv-contract-and-upload-security-baseline.md) |
| 2 | API CV module and file storage flow | Completed | 4h | [phase-02](./phase-02-api-cv-module-and-file-storage-flow.md) |
| 3 | Parsing pipeline (PDF/DOCX + Gemini normalization) | Completed | 3h | [phase-03](./phase-03-parsing-pipeline-pdf-docx-gemini-normalization.md) |
| 4 | Web candidate CV pages and actions | Completed | 3h | [phase-04](./phase-04-web-candidate-cv-pages-and-actions.md) |
| 5 | Testing and hardening | In Progress | 2h | [phase-05](./phase-05-testing-and-hardening.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phases 2-3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- Candidate can upload PDF/DOCX CV via `/cvs/upload`, get parsed data, and view own CV list/detail.
- Candidate can edit parsed fields, soft-delete CV, and set exactly one active primary CV.
- API enforces candidate ownership, file type/size policy, and consistent status codes.
- Web candidate dashboard links to CV page with upload/list/edit/delete/set-primary actions.
- API lint/test/e2e/build and web lint/build pass for touched areas.

## Risks

- Parser failures (bad file quality, malformed DOCX/PDF) break upload experience.
- File system and DB writes can diverge on partial failure.
- Concurrent set-primary requests can produce inconsistent primary state.
- Upload endpoint can be abused if validation is weak.

## Mitigation

- Apply strict multer filter (mime + extension), file size cap, and candidate ownership checks.
- Use transactional primary switching and best-effort orphan-file cleanup.
- Graceful parse fallback with structured minimal `parsedData` instead of hard failure.
- Keep internal file paths out of API responses and logs.

## Unresolved Questions

- Manual browser smoke run for candidate CV flow is pending.
