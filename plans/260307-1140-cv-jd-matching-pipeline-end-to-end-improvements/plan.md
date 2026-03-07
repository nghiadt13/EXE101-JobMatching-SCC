---
title: "CV-JD Matching Pipeline End-to-End Improvement Plan"
description: "Upgrade CV-to-JD matching from ingestion through recruiter ranking with atomic skills, calibrated scores, and safe rollout controls."
status: in_progress
priority: P1
effort: 43h
branch: main
tags: [plan, matching, normalization, migration, ranking, observability]
created: 2026-03-07
---

# CV-JD Matching Pipeline End-to-End Improvement Plan

## Overview

Goal: fix skill-shape mismatch at the root, introduce a canonical atomic-skill model for both CV and JD, upgrade matching and ranking without breaking the current application flow, and ship with regression coverage, observability, and rollback.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Contract, target architecture, and rollout lock | Complete | 4h | [phase-01](./phase-01-contract-target-architecture-and-rollout-lock.md) |
| 2 | Atomic skill extraction and canonicalization pipeline | Complete | 8h | [phase-02](./phase-02-atomic-skill-extraction-and-canonicalization-pipeline.md) |
| 3 | Persistence, migration, and backfill execution | Complete | 7h | [phase-03](./phase-03-persistence-migration-and-backfill-execution.md) |
| 4 | Matching service v2 and application compatibility | Complete | 8h | [phase-04](./phase-04-matching-service-v2-and-application-compatibility.md) |
| 5 | Ranking, explainability, and recruiter review readiness | Pending | 6h | [phase-05](./phase-05-ranking-explainability-and-recruiter-review-readiness.md) |
| 6 | Regression datasets, calibration, benchmarks, and QA | Pending | 6h | [phase-06](./phase-06-regression-datasets-calibration-benchmarks-and-qa.md) |
| 7 | Observability, release, rollback, runbooks, and docs | Pending | 4h | [phase-07](./phase-07-observability-release-rollback-runbooks-and-docs.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 depends on Phases 1-3.
- Phase 5 depends on Phase 4.
- Phase 6 depends on Phases 2-5.
- Phase 7 depends on Phases 3-6.

## Execution Strategy

- Use hard execution for Phases 1-4. These phases lock contracts, storage, migration, and the compatibility adapter.
- Use controlled parallel execution after Phase 4:
  - Track A: recruiter-facing ranking and explainability surfaces.
  - Track B: regression dataset expansion, calibration analysis, and benchmark automation.
  - Track C: observability, runbooks, and docs sync.
- File ownership boundary:
  - Normalization/data model: `apps/api/src/normalization/**`, `apps/api/src/cvs/**`, `apps/api/src/jobs/**`, `apps/api/prisma/**`
  - Matching/application contract: `apps/api/src/matching/**`, `apps/api/src/applications/**`
  - Recruiter ranking UI/API client: `apps/web/components/applications/**`, `apps/web/lib/applications-client.ts`, recruiter dashboard pages
  - QA/docs/runbooks: `apps/api/test/**`, `apps/web/docs/**`, `docs/**`

## Definition Of Done

- CV and JD skills are stored and matched as atomic canonical units, while UI can still show grouped or friendly labels.
- Existing applications flow still creates records successfully with backward-compatible score fields.
- Ranking payload is recruiter-usable: sortable, explainable, and flagged when source parsing confidence is low.
- Existing rows are backfilled safely with measurable completion and rollback steps.
- Regression dataset, command gates, smoke checks, and operational runbooks are updated.

## Hard Decisions

- Canonical source of truth should be atomic skill records, not grouped display strings.
- Keep current `skills` array contract during rollout; add an adapter rather than a breaking API cutover.
- Prefer feature-flagged scoring upgrade over a big-bang replacement.
- Persist match explanation snapshot on application creation or recalculation before building a larger audit subsystem.

## Biggest Risks

- Backfill can create mixed-shape data if extraction rules are not idempotent.
- Score drift can reorder recruiter lists and create trust issues unless calibration and explanation ship together.
- Frontend and backend can diverge if display arrays stop mirroring canonical records during transition.

## Success Criteria

- Known zero-overlap bug is eliminated on grouped-skill samples.
- Recruiter ranking quality improves on the regression set without breaking current apply flow.
- Rollout can be disabled or rolled back without data loss.