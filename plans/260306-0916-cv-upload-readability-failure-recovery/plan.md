---
title: "CV Upload Readability Failure Recovery Plan"
description: "Fix candidate CV uploads failing with 'Could not read this CV file' by making parsing resilient and user-recoverable."
status: pending
priority: P1
effort: 8h
issue: "Upload returns parse-failed for valid user files"
branch: main
tags: [bugfix, cv, parsing, api, web, reliability]
created: 2026-03-06
---

# CV Upload Readability Failure Recovery Plan

## Overview

Current flow blocks upload when text extraction fails, surfacing `Could not read this CV file. Please upload another PDF/DOCX.`
This is too strict for scanned PDFs, partially corrupted exports, and edge-case DOCX variants.
Goal: upload should still succeed when possible, parsing should degrade gracefully, and user should recover from parsing gaps.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Failure signature mapping and guardrails | Pending | 1.5h | [phase-01](./phase-01-failure-signature-mapping-and-guardrails.md) |
| 2 | API parser resilience and fallback persistence | Pending | 3h | [phase-02](./phase-02-api-parser-resilience-and-fallback-persistence.md) |
| 3 | Web UX recovery for partial parse | Pending | 1.5h | [phase-03](./phase-03-web-ux-recovery-for-partial-parse.md) |
| 4 | Regression tests and docs update | Pending | 2h | [phase-04](./phase-04-regression-tests-and-docs-update.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phases 2-3.

## Definition Of Done

- Candidate upload no longer fails hard for parse edge cases where file is valid but extraction is weak.
- API distinguishes: unsupported/invalid file vs parse-limited file.
- CV record is saved with safe fallback parsed payload when extraction/AI parse is not reliable.
- Candidate sees clear post-upload warning and can continue editing skills/summary manually.
- Lint/tests/build pass for touched apps.

## Risks

- Overly permissive fallback may allow poor-quality CVs that reduce matching quality.
- Silent fallback without user signal can hide parsing problems.
- Parser fallback path may create inconsistent parsedData shape.

## Mitigation

- Keep strict file-type validation (mime+extension), only relax extraction failure handling.
- Add explicit parse status/warning surface in API response (or deterministic marker in parsedData).
- Keep normalized parsedData schema stable in all code paths.

## Unresolved Questions

- Do we want OCR for image-only PDFs in MVP, or defer and keep manual-edit fallback only?
