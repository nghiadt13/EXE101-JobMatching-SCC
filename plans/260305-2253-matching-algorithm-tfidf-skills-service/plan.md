---
title: "Matching Algorithm Plan (TF-IDF + Skills + Matching API)"
description: "Implement deterministic matching service using CV text/skills and Job description/skills with weighted final score and breakdown."
status: completed
priority: P1
effort: 12h
issue: null
branch: main
tags: [feature, backend, matching, tfidf, scoring]
created: 2026-03-05
---

# Matching Algorithm Plan (TF-IDF + Skills + Matching API)

## Overview

Feature tie to checklist Day 10-11: TF-IDF calculation, skills scoring, weighted final score, matching service, and endpoint validation.
Scope MVP only: deterministic scoring (`0-100`) with no semantic embeddings yet.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Matching contract and scoring baseline | Completed | 1.5h | [phase-01](./phase-01-matching-contract-and-scoring-baseline.md) |
| 2 | Calculator core (TF-IDF + skills + final score) | Completed | 3h | [phase-02](./phase-02-calculator-core-tfidf-skills-final-score.md) |
| 3 | Matching API endpoint and data loading | Completed | 3h | [phase-03](./phase-03-matching-api-endpoint-and-data-loading.md) |
| 4 | Integration prep for applications flow | Completed | 2h | [phase-04](./phase-04-integration-prep-for-applications-flow.md) |
| 5 | Testing, performance checks, and hardening | Completed | 2.5h | [phase-05](./phase-05-testing-performance-checks-and-hardening.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phases 2-3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- API exposes `POST /matching/calculate` with `cvId`, `jobId`.
- Service computes:
  - `tfidfScore` (`0-1`)
  - `skillsScore` (`0-1`)
  - `score` (`0-100`, rounded)
  - breakdown (`matchedSkills`, `missingSkills`).
- Matching only allowed when CV and Job are valid/visible for intended flow (internal-safe checks).
- Unit + e2e tests cover formula correctness and error boundaries.
- API lint/test/e2e/build pass on touched modules.

## Risks

- TF-IDF noise from low-quality parsed text degrades score reliability.
- Score drift if normalization differs across calculators.
- Compute spikes when repeatedly matching same CV/Job pairs.

## Mitigation

- Normalize tokens/text consistently before TF-IDF.
- Keep formula centralized in one pure calculator service.
- Add cheap guards and optional memoization hook point for later optimization.

## Unresolved Questions

- Whether to cache repeated match results in DB before applications phase.
