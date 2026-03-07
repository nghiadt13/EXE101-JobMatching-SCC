---
title: "LLM-Only Normalization + Error Surfacing + OpenAI Provider Plan"
description: "Remove fallback parsing behavior, expose AI/API failures clearly in the web app, and add a second LLM provider path with a new env key."
status: completed
priority: P1
effort: 17h
branch: main
tags: [plan, ai, normalization, fallback-removal, openai, frontend]
created: 2026-03-07
completed: 2026-03-07
---

# LLM-Only Normalization + Error Surfacing + OpenAI Provider Plan

## Overview

Goal: remove AI parsing and normalization fallback behavior across active CV, JD, and matching paths so the system is explicitly LLM-only; surface AI/API failures to users instead of silently degrading; and add one OpenAI-backed provider/model with its own env key.

This plan avoids a broad AI platform rewrite. It keeps one normalization contract, introduces one provider abstraction only where current Gemini-specific code blocks the change, and treats provider failure as an error outcome rather than a synthetic fallback result.

## Recommended Planning Mode

`two`

Reason: Phase 1 must lock contract and rollout semantics first. After that, work splits into two implementation streams with limited overlap:

- Stream A: backend LLM provider abstraction, fallback removal, matching compatibility.
- Stream B: frontend failure surfacing, docs, env, and rollout messaging.

Starting fully parallel from the beginning is too risky because `ParseStatus`, telemetry shape, matching assumptions, and upload failure semantics are still coupled.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Contract lock: failure semantics, status cleanup, rollout gates | Completed | 2h | [phase-01](./phase-01-contract-lock-failure-semantics-status-cleanup-and-rollout-gates.md) |
| 2 | Backend: provider abstraction, OpenAI integration, and fallback removal | Completed | 5h | [phase-02](./phase-02-backend-provider-abstraction-openai-integration-and-fallback-removal.md) |
| 3 | Matching and persistence: remove legacy read fallbacks safely | Completed | 4h | [phase-03](./phase-03-matching-and-persistence-remove-legacy-read-fallbacks-safely.md) |
| 4 | Web UX: surface AI/API failures in CV and JD flows | Completed | 3h | [phase-04](./phase-04-web-ux-surface-ai-api-failures-in-cv-and-jd-flows.md) |
| 5 | Tests, env, docs, secret rotation, and rollout checklist | Completed | 3h | [phase-05](./phase-05-tests-env-docs-secret-rotation-and-rollout-checklist.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 depends on Phases 1-2.
- Phase 5 depends on Phases 2-4.

## Execution Strategy

- Lock the parse/error contract first. Do not let backend and web invent different meanings for failed normalization.
- Run backend provider work first. Web error surfacing can start once API error semantics are fixed.
- Keep provider abstraction narrow: one client interface, one selection point, shared prompt/repair/validation path.
- Remove fallback reads only after confirming all active write paths persist `skillAtoms` and after defining the backfill/release gate.

## File Ownership Matrix

- Phase 1: contracts and docs only. No runtime provider logic.
- Phase 2: `apps/api/src/normalization/**`, `apps/api/src/cvs/services/cv-ai-parser.service.ts`, `apps/api/src/cvs/cvs.module.ts`, `apps/api/package.json`.
- Phase 3: `apps/api/src/cvs/cvs.service.ts`, `apps/api/src/jobs/jobs.service.ts`, `apps/api/src/matching/**`.
- Phase 4: `apps/web/components/cv/**`, `apps/web/components/jobs/**`, `apps/web/lib/cv-client.ts`, `apps/web/lib/jobs-client.ts`, candidate/recruiter dashboard pages.
- Phase 5: touched specs, `README.md`, `docs/03-api-endpoints.md`, `docs/04-matching-algorithm.md`, `docs/05-implementation-checklist.md`.

## Scope Lock

### In Scope

- Remove fallback result generation from normalization and parser services used by CV/JD ingestion.
- Replace Gemini-only wiring with a thin provider abstraction and one OpenAI-backed provider path.
- Add env-driven provider/model selection and a new OpenAI API key variable.
- Update frontend upload and review flows so AI/API failures are visible and actionable.
- Remove legacy matching fallback reads from `skills` when `skillAtoms` is missing, with a backfill or release gate.
- Update docs and tests to match the new non-fallback behavior.

### Out Of Scope

- Async job queueing, retries, or background orchestration.
- Multi-provider routing logic beyond one selected provider at a time.
- Schema redesign of normalized payloads.
- OCR or broader document extraction improvements.
- New analytics or observability platform work beyond touched telemetry/contracts.

## Hard Decisions To Lock Early

- LLM failure semantics: ingestion should fail fast with an explicit API error instead of persisting a synthetic fallback parse.
- Status contract: `fallback` should be removed from active parsing contracts; likely end state is `parsed_ok | needs_review`, with failure handled out-of-band as HTTP error.
- Telemetry contract: remove `fallbackUsed`; replace source semantics with provider-oriented metadata only if UI/tests need it.
- Matching safety: do not keep legacy `skills` read fallback indefinitely. Either backfill missing `skillAtoms` before release or block release until records are repaired.
- Provider design: keep Gemini and OpenAI both selectable through env behind one small client boundary. Do not duplicate prompt, repair, and validation logic across provider clients.
- OpenAI path: use direct OpenAI API, not Azure OpenAI.
- Model selection: let env choose the active model name rather than hard-coding one default plan decision.
- Failure contract: use one stable parse-failure API contract for frontend handling rather than multiple failure codes.
- Secret hygiene: the checked-in API env must be rotated and treated as compromised.

## Likely File Groups

### Backend Normalization + Providers

- `apps/api/src/normalization/ai-normalization.service.ts`
- `apps/api/src/normalization/gemini-client.service.ts`
- `apps/api/src/normalization/normalization.types.ts`
- `apps/api/src/normalization/normalization.module.ts`
- `apps/api/src/normalization/ai-normalization.service.spec.ts`
- `apps/api/src/cvs/services/cv-ai-parser.service.ts`
- `apps/api/src/cvs/cvs.module.ts`
- `apps/api/package.json`

### Backend Domain Services + Matching

- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/cvs/cvs.service.spec.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/api/src/matching/matching.service.ts`
- `apps/api/src/matching/matching.service.spec.ts`
- `apps/api/src/matching/services/skill-storage-adapter.service.ts`
- `apps/api/src/matching/services/skill-storage-adapter.service.spec.ts`
- `apps/api/src/matching/types/skill-canonical.types.ts`

### Web Upload + Review UX

- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/components/cv/cv-upload-form.tsx`
- `apps/web/components/cv/cv-list.tsx`
- `apps/web/components/jobs/jd-upload-form.tsx`
- `apps/web/components/jobs/recruiter-jobs-table.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/lib/cv-client.ts`
- `apps/web/lib/jobs-client.ts`

### Docs + Env

- `README.md`
- `docs/03-api-endpoints.md`
- `docs/04-matching-algorithm.md`
- `docs/05-implementation-checklist.md`
- `apps/api/.env` (rotation/manual update only, not for committing secrets)

## Definition Of Done

- CV and JD ingestion no longer create fallback parse payloads when the LLM is unavailable, invalid, or times out.
- One OpenAI-backed provider is available behind env configuration, without duplicating normalization logic.
- Web upload flows show clear failure states for AI/API errors instead of ambiguous generic failure or silent degraded success.
- Matching no longer relies on legacy `skills` read fallback in normal operation.
- Tests, docs, and env instructions no longer refer to fallback parsing as a supported behavior.

## Validation Gates

- API unit tests cover provider missing key, timeout, provider exception, invalid JSON, and successful parse.
- Matching tests fail if `deriveFromLegacySkills()` is still used on active read paths.
- Candidate CV upload and recruiter JD upload both expose actionable UI error messages.
- README and project docs describe `OPENAI_API_KEY`, provider selection, and the new failure contract.
- Operational checklist includes secret rotation for any exposed AI key and a verified plan for old rows missing `skillAtoms`.

## Top Risks

- Release-break risk: removing fallback will convert transient provider failures into visible user failures.
- Data-compat risk: old CV/Job rows without `skillAtoms` can reduce or break matching if fallback reads are removed before backfill.
- Scope creep risk: provider abstraction can balloon into a general AI platform if not kept small.
- Secret risk: existing checked-in API secret must be rotated before any provider work is treated as safe.

## Remaining Open Questions

- Can release require a one-time backfill for missing `skillAtoms`, or must matching preserve compatibility for old rows longer?
- Is `CvAiParserService` still on an active runtime path, or can it be removed instead of migrated?