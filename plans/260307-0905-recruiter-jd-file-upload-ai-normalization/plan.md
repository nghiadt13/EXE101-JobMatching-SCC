---
title: "Recruiter JD File Upload + AI Normalization Plan"
description: "Add recruiter JD PDF/DOCX upload that mirrors the CV flow while keeping the existing Job lifecycle and normalized schema stable."
status: complete
priority: P1
effort: 17h
branch: main
tags: [plan, jobs, jd, upload, ai, normalization, recruiter]
created: 2026-03-07
completed: 2026-03-07
---

# Recruiter JD File Upload + AI Normalization Plan

## Overview

Goal: recruiter uploads a JD file, API extracts text, normalizes it into `candidate_job_profile_v1`, creates a new draft Job, and the recruiter reviews/edits the parsed result before publish. Keep matching unchanged by preserving `location.__normalization.normalizedProfile`.

This plan deliberately extends the current Job flow instead of introducing a separate JD entity. JD upload is an alternate input mode for draft Job creation, not a second job-management system.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Contract, provenance shape, and persistence decision | Complete | 2h | [phase-01](./phase-01-contract-provenance-shape-and-persistence-decision.md) |
| 2 | Shared extraction reuse and normalization hardening | Complete | 3h | [phase-03](./phase-03-shared-extraction-reuse-and-normalization-hardening.md) |
| 3 | Backend JD upload endpoint and draft Job creation | Complete | 4h | [phase-02](./phase-02-backend-jd-upload-endpoint-and-draft-job-creation.md) |
| 4 | Recruiter upload, review, and edit UX | Complete | 5h | [phase-04](./phase-04-recruiter-upload-review-and-edit-ux.md) |
| 5 | Tests, rollout checks, and docs sync | Complete | 3h | [phase-05](./phase-05-tests-rollout-checks-and-docs-sync.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 depends on Phases 2-3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- Recruiter can upload a PDF or DOCX JD and receive a draft Job with parsed preview.
- Uploaded JD uses the same `AiNormalizationService.normalizeJob` path as existing manual job create/update.
- Job normalization stays available through `location.__normalization.normalizedProfile`, so matching remains backward-compatible.
- Recruiter can review and correct parsed fields before publish without needing a separate JD management page.
- Validation, fallback, and cleanup behaviors are covered by tests for touched backend/frontend flows.

## Recommended Scope

### MVP

- Add recruiter-only multipart JD upload entrypoint that creates a draft Job from file.
- Mirror CV flow: validate PDF/DOCX file, extract text, call `AiNormalizationService.normalizeJob`, persist parse status/telemetry, keep sync processing.
- Keep shared schema stable; no change to `candidate_job_profile_v1` or matching contracts.
- Keep Job as the only source-of-truth entity; uploaded file is provenance, not a separate JD record.
- Persist JD source metadata inside `job.location.__normalization.sourceDocument` for MVP to avoid a Prisma migration unless download/history becomes a hard requirement.
- Keep provenance metadata internal-only in MVP; recruiter UI continues to consume existing `parseStatus`, `parseTelemetry`, and `normalizedProfile` contract.
- Map normalized output back into editable job fields (`title`, `description`, `skills`, `employmentType`) and reuse current recruiter edit pages as the review surface.
- Show parse status, fallback warning, and manual correction path before publish.
- Always create a new draft Job on upload; no existing-draft replacement flow in MVP.

### Defer

- Async queue, OCR, retry orchestration, or chunked large-file processing.
- Multiple JD files, JD version history, replacement of existing drafts from file, or downloadable original files.
- Moving normalization/source metadata out of `location.__normalization` into first-class Job columns.
- Automatic backfill for old jobs created from form-only input.

## Hard Decisions

- Source of truth: after upload, the Job row stays authoritative; any recruiter edit should re-normalize and overwrite old JD-derived normalized data.
- Storage: for MVP, prefer file path + provenance in normalization meta over new Prisma columns; only pay the migration cost if product needs file lifecycle outside parsing.
- Pipeline reuse: do not build a second JD-only parser stack. Either extract shared document helpers from CV services or create thin Job services over the same PDF/DOCX libraries.
- Failure mode: follow CV semantics. Reject unsupported/unreadable files, but if extraction succeeds and AI normalization degrades, save a draft with `needs_review` or `fallback` instead of blocking the recruiter.
- Metadata preservation: `JobsService.update` must merge existing normalization provenance when recruiter edits the draft; otherwise `sourceDocument` will be dropped after the first edit.
- Field safety: JD-derived title, description, skills, and employment type must be normalized/truncated to the same limits the manual DTOs enforce, so uploaded drafts can round-trip through the existing edit form.

## Likely Files And Modules

### Modify

- `apps/api/src/jobs/jobs.controller.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.types.ts`
- `apps/api/src/jobs/jobs.module.ts`
- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/api/src/jobs/dto/create-job.dto.ts`
- `apps/api/src/jobs/dto/update-job.dto.ts`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/lib/jobs-client.ts`

### Create

- `apps/api/src/jobs/services/job-storage.service.ts` or shared `document-storage.service.ts`
- `apps/api/src/jobs/services/job-text-extractor.service.ts` or shared `document-text-extractor.service.ts`
- `apps/web/components/jobs/jd-upload-form.tsx`
- `apps/api/src/jobs/dto/upload-job-file.dto.ts` if dedicated validation DTO is cleaner than inline parsing

### Optional If Shared Helpers Are Extracted

- `apps/api/src/cvs/services/cv-storage.service.ts`
- `apps/api/src/cvs/services/cv-text-extractor.service.ts`
- `apps/api/src/cvs/cvs.module.ts`

## Biggest Risks

- Field drift: uploaded file content and later recruiter edits can diverge; mitigate by treating manual job fields as canonical and re-normalizing on edit.
- Hidden storage debt: keeping file metadata inside `location.__normalization` is fast now but harder to query later; acceptable for MVP, not for audit/history features.
- UX ambiguity: recruiters may not understand whether upload replaces manual fields or supplements them; the flow must say upload creates a draft to review.
- Duplicate pipeline creep: copying CV helpers into Jobs will create two maintenance paths; avoid this early.
- Metadata loss on update: provenance fields will disappear unless update logic merges old normalization meta into the new payload.
- Oversized normalized text: JD-derived text can violate current DTO limits unless mapper-level truncation rules are explicit.

## Success Criteria

- Recruiter can upload PDF/DOCX JD and get a draft Job with parsed preview.
- Existing job edit/publish/matching flows continue to work without a separate JD code path.
- Schema version stays `candidate_job_profile_v1` and matching still reads `location.__normalization.normalizedProfile`.
- Fallback/manual-review path is explicit and test-covered.

## Scope Decisions Locked

- Upload always creates a new draft Job in MVP.
- Supported file types in MVP: PDF and DOCX only.
- Original JD file remains internal provenance only; no recruiter download/view endpoint in MVP.