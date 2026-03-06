---
title: "Unified AI Normalization Plan (CV + Job Description Shared Schema)"
description: "Refactor CV and Job pipelines to normalize both inputs through AI into one shared structured schema for consistent matching and future search/filter features."
status: in_progress
priority: P1
effort: 22h
issue: "CV/JD parsing inconsistency causes weak extraction and unreliable matching"
branch: main
tags: [refactor, ai, cv, jobs, matching, frontend, backend]
created: 2026-03-06
---

# Unified AI Normalization Plan (CV + Job Description Shared Schema)

## Overview

Goal: bất kỳ CV hoặc JD nào cũng được đưa về cùng 1 format chuẩn thông qua AI pipeline để matching dễ, ổn định, và mở rộng được.
Scope gồm backend normalization pipeline + API contract + frontend refactor cho candidate/recruiter.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Shared schema contract and migration strategy | Completed | 3h | [phase-01](./phase-01-shared-schema-contract-and-migration-strategy.md) |
| 2 | Backend AI normalization services (CV + JD) | Completed | 6h | [phase-02](./phase-02-backend-ai-normalization-services-cv-jd.md) |
| 3 | Persist normalized payload and matching adapter | Completed | 4h | [phase-03](./phase-03-persist-normalized-payload-and-matching-adapter.md) |
| 4 | Frontend refactor (Recruiter Job + Candidate CV review UX) | Completed | 5h | [phase-04](./phase-04-frontend-refactor-job-cv-normalized-review-ux.md) |
| 5 | Validation, tests, rollout flags, docs | In Progress | 4h | [phase-05](./phase-05-validation-tests-rollout-and-docs.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 depends on Phases 1-3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- CV upload và Job create/update đều trigger AI normalization.
- Cả CV và Job lưu được normalized payload cùng schema version.
- Matching layer dùng normalized schema làm input chính (fallback safe với data cũ).
- FE cho recruiter/candidate hiển thị parsed result dạng review/edit trước khi finalize.
- API/Web lint + relevant test suites + builds pass.

## Proposed Shared Schema (v1)

```json
{
  "schemaVersion": "candidate_job_profile_v1",
  "language": "vi|en|mixed",
  "title": "string",
  "summary": "string",
  "skills": ["string"],
  "experience": [
    {
      "role": "string",
      "company": "string",
      "startDate": "YYYY-MM|YYYY|null",
      "endDate": "YYYY-MM|YYYY|null",
      "highlights": ["string"]
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "field": "string",
      "startDate": "YYYY-MM|YYYY|null",
      "endDate": "YYYY-MM|YYYY|null"
    }
  ],
  "certifications": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "tech": ["string"]
    }
  ],
  "languages": ["string"],
  "location": {
    "city": "string",
    "country": "string"
  },
  "rawQuality": {
    "score": 0,
    "needsManualReview": true,
    "reason": "string"
  }
}
```

## Key Design Decisions

- Không phụ thuộc heading cố định (`skills`, `kỹ năng`, `competencies`...) -> AI map về key chuẩn.
- CV và JD dùng chung schema core, riêng field đặc thù JD (benefits, requirements, employmentType) để extension block `jobMeta`.
- Parse bất đồng bộ là future; MVP implement sync + timeout + fallback rule-based.
- Mọi parse output phải qua normalizer + validator trước khi persist.

## Risks

- LLM output không stable (invalid JSON, hallucination fields).
- Latency tăng khi parse cả CV và JD lúc submit form.
- Dữ liệu cũ (legacy rows) không có normalized payload gây mismatch.

## Mitigation

- Strict JSON extraction + schema validation + one retry repair prompt.
- Timeout cứng + fallback parser deterministic.
- Adapter layer: nếu chưa có normalized data thì synthesize từ fields cũ.

## Unresolved Questions

- Async queue deferred: không làm trong phase này, giữ sync parsing cho MVP để giảm scope.
