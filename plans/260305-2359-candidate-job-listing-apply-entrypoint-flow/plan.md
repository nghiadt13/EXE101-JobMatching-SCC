---
title: "Candidate Job List + Apply Entry Flow Plan"
description: "Ensure candidate can discover published jobs, open details, and apply with clear UX states and role-safe handling."
status: completed
priority: P1
effort: 8h
issue: null
branch: main
tags: [candidate, jobs, applications, ux, flow]
created: 2026-03-05
---

# Candidate Job List + Apply Entry Flow Plan

## Overview

Goal: candidate có thể thấy list công việc, mở chi tiết, và apply khi cần với UX rõ ràng.
Current baseline exists; this plan focuses on gap closing, consistency, and verification.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Gap audit + acceptance contract | Completed | 1.5h | [phase-01](./phase-01-gap-audit-and-acceptance-contract.md) |
| 2 | Job list candidate UX + apply entrypoint | Completed | 2h | [phase-02](./phase-02-job-list-candidate-ux-and-apply-entrypoint.md) |
| 3 | Job detail apply flow hardening | Completed | 2h | [phase-03](./phase-03-job-detail-apply-flow-hardening.md) |
| 4 | API/permission safety checks for apply path | Completed | 1h | [phase-04](./phase-04-api-permission-safety-checks-for-apply-path.md) |
| 5 | Tests, smoke docs, and release sync | Completed | 1.5h | [phase-05](./phase-05-tests-smoke-docs-and-release-sync.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 can run parallel with late Phase 3 adjustments.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- Candidate sees published jobs list with clear CTA to open/apply.
- Job detail page has predictable apply states: unauthenticated, wrong role, no CV, duplicate apply, success.
- Apply API remains candidate-only and duplicate-safe.
- Candidate smoke checklist includes explicit browse->apply verification steps.
- API/web lint + build + relevant tests pass.

## Risks

- UX ambiguity between “view detail” and “apply now” actions.
- Hidden regressions in existing application flow while adjusting job pages.
- Role leakage if unauthenticated/recruiter/admin apply behavior is not explicit.

## Mitigation

- Freeze acceptance states before edits.
- Keep backend permissions unchanged unless bug found.
- Add/extend tests for candidate apply edge cases.

## Decision Notes

- Apply path is detail-first. Job list CTA points to detail page, then candidate applies from detail form.
