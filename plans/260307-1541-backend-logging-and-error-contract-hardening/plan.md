---
title: "Backend Logging And Error Contract Hardening Plan"
description: "Add structured backend logging, a stable API error envelope, and smoother frontend error surfacing for easier debugging."
status: planned
priority: P1
effort: 21h
branch: main
tags: [plan, backend, frontend, logging, observability, errors]
created: 2026-03-07
---

# Backend Logging And Error Contract Hardening Plan

## Overview

Goal: make backend failures diagnosable without guessing, standardize API error responses across CV/JD and other write paths, and let the web app display backend error details in a user-safe but debug-friendly way.

This plan avoids a full observability platform rewrite. It keeps Nest Logger as the base, adds request correlation and one shared error envelope, then upgrades the highest-value flows first: CV upload, JD upload, job save, normalization, and Prisma-backed persistence failures.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Contract lock: error envelope, correlation, redaction, and UX rules | Planned | 3h | [phase-01](./phase-01-contract-lock-error-envelope-correlation-redaction-and-ux-rules.md) |
| 2 | Backend foundation: request context, global exception filter, and logger helpers | Planned | 5h | [phase-02](./phase-02-backend-foundation-request-context-global-exception-filter-and-logger-helpers.md) |
| 3 | Domain instrumentation: jobs, cvs, normalization, documents, and Prisma | Planned | 6h | [phase-03](./phase-03-domain-instrumentation-jobs-cvs-normalization-documents-and-prisma.md) |
| 4 | Web contract adoption: API client upgrade and smoother dashboard error surfacing | Planned | 4h | [phase-04](./phase-04-web-contract-adoption-api-client-and-dashboard-error-surfacing.md) |
| 5 | Tests, docs, rollout, and operational debugging checklist | Planned | 3h | [phase-05](./phase-05-tests-docs-rollout-and-operational-debugging-checklist.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 depends on Phases 1-2.
- Phase 5 depends on Phases 2-4.

## Execution Strategy

- Lock one response contract first. Do not let services, controllers, and Next server actions each invent their own error shape.
- Add correlation and global exception handling before touching many domain services, otherwise logs stay fragmented.
- Upgrade the web client after the backend envelope is stable; keep current page redirects working during transition.
- Prioritize write paths that already show pain: JD upload, CV upload, manual job create/update, normalization failures, and DB write failures.

## Scope Lock

### In Scope

- Request-scoped correlation id and shared log context in NestJS.
- One stable API error envelope with `code`, `message`, `requestId`, `statusCode`, and optional safe `details`.
- Structured logging for success, warn, and failure paths in upload/parse/save flows.
- Frontend `ApiError` enrichment so pages can use backend error code/message/request id instead of only HTTP status.
- Docs and tests covering the new contract.

### Out Of Scope

- External log aggregation stack migration.
- Full tracing or metrics platform rollout.
- Background queue/retry architecture.
- Rewriting every page to client-side toasts.

## Likely File Groups

- Backend app shell: `apps/api/src/main.ts`, new shared error/logging utilities under `apps/api/src/common/**`.
- Backend domains: `apps/api/src/jobs/**`, `apps/api/src/cvs/**`, `apps/api/src/normalization/**`, `apps/api/src/documents/**`, `apps/api/src/prisma/**`.
- Web adoption: `apps/web/lib/api-client.ts`, `apps/web/lib/jobs-client.ts`, `apps/web/lib/cv-client.ts`, recruiter/candidate dashboard pages.
- Docs/tests: `README.md`, `docs/03-api-endpoints.md`, `docs/05-implementation-checklist.md`, relevant unit and e2e specs.

## Definition Of Done

- Backend error responses share one envelope and include a correlation id.
- JD and CV upload failures log enough context to diagnose root cause without exposing sensitive raw document content.
- Frontend surfaces backend-provided message and request id cleanly instead of collapsing to generic `upload-failed` in common cases.
- Tests lock the contract for 4xx/5xx flows and docs explain how to debug with the request id.

## Top Risks

- Logging too much can leak secrets, PII, or raw resume/JD text.
- Inconsistent exception mapping can create mixed payload shapes during rollout.
- Frontend adoption can drift if some pages keep using status-only redirects.
