---
title: "Schema-Based Matching Pipeline Migration Plan"
description: "Replace TF-IDF plus exact skill matching with recruiter-centric schema extraction, CV evaluation, deterministic scoring, and staged cleanup."
status: complete
priority: P1
effort: 36h
branch: main
tags: [matching, schema, migration, cleanup, cv, jd, rollout]
created: 2026-03-07
last-updated: 2026-03-07
---

# Schema-Based Matching Pipeline Migration Plan

## Overview

Goal: replace the current TF-IDF + exact skill atom matcher with a schema-based pipeline:

1. JD upload/manual entry -> extract `requirements schema`
2. CV upload/edit -> extract `candidate profile`
3. Application create / ranking -> evaluate CV against that schema
4. Deterministic scorer -> final `matchScore`

Principles:

- Use LLM only for structured extraction, never for final judgment.
- Keep CV upload and JD upload synchronous in the user flow for now so parse failures still surface immediately in the shared error envelope.
- Use async/background work only for backfill, repair, and optional reprocessing.
- Preserve current application flow and numeric `matchScore` sorting while replacing the explanation model behind it.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Cleanup, inventory, and rollout lock | Pending | 4h | [phase-01](./phase-01-cleanup-inventory-and-rollout-lock.md) |
| 2 | Data model, schema contract, and migration path | Complete | 5h | [phase-02](./phase-02-data-model-schema-contract-and-migration-path.md) |
| 3 | JD requirements extraction and recruiter upload flow | Complete | 6h | [phase-03](./phase-03-jd-requirements-extraction-and-recruiter-upload-flow.md) |
| 4 | CV profile extraction and candidate upload flow | Complete | 5h | [phase-04](./phase-04-cv-profile-extraction-and-candidate-upload-flow.md) |
| 5 | Deterministic evaluation, scoring, and application compatibility | Complete | 7h | [phase-05](./phase-05-deterministic-evaluation-scoring-and-application-compatibility.md) |
| 6 | Frontend UX cleanup, review surfaces, and compatibility adapters | Complete | 5h | [phase-06](./phase-06-frontend-ux-cleanup-review-surfaces-and-compatibility-adapters.md) |
| 7 | Backfill, validation, rollout, and docs sync | Complete | 4h | [phase-07](./phase-07-backfill-validation-rollout-and-docs-sync.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 depends on Phases 1-2.
- Phase 5 depends on Phases 2-4.
- Phase 6 depends on Phases 3-5.
- Phase 7 depends on Phases 2-6.

## Execution Strategy

- Do not do a big-bang replace.
- First remove clearly dead or obsolete logic and isolate live legacy matching behind one boundary.
- Introduce additive schema fields and additive snapshot versions before deleting old score components.
- Keep uploads synchronous and user-facing.
- Run backfill/re-evaluation asynchronously outside the upload path.
- Cut application creation to the new scorer first, then clean out TF-IDF/exact-skill runtime logic after validation.

## Target Architecture

```text
JD text/file
  -> extractor
  -> LLM structured extraction
  -> requirements schema v1
  -> persist on Job

CV file/manual edits
  -> extractor
  -> LLM structured extraction
  -> candidate profile v1
  -> persist on CV

Application create / recruiter ranking
  -> deterministic evaluator
  -> requirement-level evaluation
  -> deterministic score breakdown
  -> persisted snapshot on Application
```

## Most Relevant Existing Areas

Backend:

- `apps/api/prisma/schema.prisma`
- `apps/api/src/normalization/**`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/matching/**`
- `apps/api/src/applications/applications.service.ts`
- `apps/api/src/common/errors/**`

Frontend:

- `apps/web/lib/jobs-client.ts`
- `apps/web/lib/cv-client.ts`
- `apps/web/lib/applications-client.ts`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/components/jobs/jd-upload-form.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/components/cv/cv-upload-form.tsx`
- `apps/web/components/cv/cv-list.tsx`
- `apps/web/components/applications/recruiter-applications-table.tsx`
- `apps/web/components/applications/candidate-applications-table.tsx`

## Definition Of Done

- New JD and CV records persist stable schema objects instead of relying on TF-IDF text similarity inputs.
- Application creation uses deterministic evaluation against JD requirements schema.
- Recruiter UI shows schema-based explanation and gaps, not TF-IDF + exact-skill artifacts.
- Existing upload UX remains stable: same endpoints, same synchronous failure behavior, same error envelope.
- This environment has a clear destructive-reset rollout path; production backfill remains a separate concern if historical data must be preserved.
- Old TF-IDF/exact-skill runtime logic is removed or isolated behind a short-lived compatibility adapter, then deleted.

## Biggest Risks

- Schema extraction can be too loose unless the contract is narrow and validated.
- Deleting old score fields too early can break recruiter tables and application history views.
- Mixed old/new application snapshots can create UI ambiguity during rollout.
- Backfill quality can drift from live extraction if prompts or validators diverge.

## Success Criteria

- Alias mismatch and rigid canonical-skill false negatives no longer dominate scores.
- Recruiter-facing ranking is explainable in requirement terms: met, partial, missing, and evidence.
- CV upload and JD upload remain stable and understandable for end users.
- Rollout is reversible while historical data preservation is not required.

## Open Questions

- None blocking. Use synchronous uploads for the first release; revisit queues only if latency or provider reliability becomes unacceptable.