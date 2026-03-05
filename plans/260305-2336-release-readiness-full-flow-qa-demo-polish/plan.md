---
title: "Release Readiness Plan (Full-Flow QA + Demo + Docs)"
description: "Complete Day 14 scope: test all core flows, fix regressions, enrich demo seed data, update README/demo script, and ship MVP-ready verification artifacts."
status: completed
priority: P1
effort: 14h
issue: null
branch: main
tags: [release-readiness, qa, testing, demo, docs]
created: 2026-03-05
---

# Release Readiness Plan (Full-Flow QA + Demo + Docs)

## Overview

Next roadmap item after dashboard is Day 14 (Testing & Polish).
Scope: consolidate quality gates and demo readiness for MVP localhost delivery.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Acceptance matrix and test scope lock | Completed | 2h | [phase-01](./phase-01-acceptance-matrix-and-test-scope-lock.md) |
| 2 | Demo seed data hardening and scenario coverage | Completed | 3h | [phase-02](./phase-02-demo-seed-data-hardening-and-scenario-coverage.md) |
| 3 | Full-flow QA execution and bug-fix batch | Completed | 4h | [phase-03](./phase-03-full-flow-qa-execution-and-bug-fix-batch.md) |
| 4 | README quickstart + demo script completion | Completed | 3h | [phase-04](./phase-04-readme-quickstart-and-demo-script-completion.md) |
| 5 | Final release checklist and sign-off report | Completed | 2h | [phase-05](./phase-05-final-release-checklist-and-sign-off-report.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 can run in parallel with late Phase 3 fixes.
- Phase 5 depends on Phases 3-4.

## Definition Of Done

- Core manual smoke checklists (auth/user/cv/jobs/applications/dashboard) all pass.
- API and web validation commands pass consistently.
- Seed data supports all three demo scenarios without manual DB edits.
- README includes clear local run/test workflow and known constraints.
- Demo script documented with step-by-step presenter flow + expected outcomes.
- Checklist and docs reflect true implementation state (no stale TODO mismatch).

## Risks

- Hidden regressions across role-based paths when running full flow end-to-end.
- Demo data not covering edge transitions (job status / application status).
- Documentation drift: commands differ from current runtime requirements.

## Mitigation

- Execute role-by-role smoke matrix with explicit pass/fail evidence.
- Extend seed fixtures to include draft/published/closed jobs and status variety.
- Validate README commands by actually running them before sign-off.

## Unresolved Questions

- Whether to add lightweight automated web e2e (Playwright) in MVP scope or keep manual smoke only.
