# Phase 1: Contract Lock, Failure Semantics, Status Cleanup, And Rollout Gates

## Context Links

- `job-matching/apps/api/src/normalization/normalization.types.ts`
- `job-matching/apps/api/src/normalization/ai-normalization.service.ts`
- `job-matching/apps/web/lib/cv-client.ts`
- `job-matching/apps/web/lib/jobs-client.ts`
- `job-matching/docs/03-api-endpoints.md`
- `job-matching/docs/04-matching-algorithm.md`

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 2h  
**Completed:** 2026-03-07

Lock the user-visible and API-visible meaning of parse success, parse review, and parse failure before any provider or frontend work starts.

## Key Insights

- Current API and web contracts still encode `fallback` as if it were a valid parse outcome.
- Current telemetry shape (`source`, `fallbackUsed`) leaks degraded-mode assumptions into web rendering and tests.
- Matching docs still describe legacy fallback reads from `skills`, so rollout can break if contracts are cleaned up without a release gate.

## File Ownership

- `apps/api/src/normalization/normalization.types.ts`
- `apps/web/lib/cv-client.ts`
- `apps/web/lib/jobs-client.ts`
- `README.md`
- `docs/03-api-endpoints.md`
- `docs/04-matching-algorithm.md`

## Requirements

- Remove `fallback` from the planned steady-state parsing contract unless a strong compatibility reason survives review.
- Define one stable API failure contract when provider key is missing, provider request fails, or model returns invalid JSON.
- Define rollout gate for matching records that still depend on legacy skill fallback.

## Architecture

- Contract boundary 1: backend normalization result vs HTTP failure.
- Contract boundary 2: web API clients vs UI banners/form error states.
- Contract boundary 3: matching runtime vs historical rows that still depend on legacy skill data.

## Related Code Files

- Modify: `apps/api/src/normalization/normalization.types.ts` to remove fallback-oriented status/source semantics.
- Modify: `apps/web/lib/cv-client.ts` and `apps/web/lib/jobs-client.ts` to reflect new error envelope assumptions.
- Modify: `README.md`, `docs/03-api-endpoints.md`, and `docs/04-matching-algorithm.md` so docs stop advertising fallback behavior.
- No new runtime files expected in this phase.

## Implementation Steps

1. Decide final `ParseStatus` values and telemetry fields.
2. Decide one HTTP/application error contract for all parse failures so frontend handling stays simple.
3. Document whether upload/create endpoints fail hard or create nothing on parse failure.
4. Lock migration/backfill release gate for `skillAtoms` removal of fallback reads.

## Todo List

- [x] Remove `fallback` from the target parsing contract or explicitly justify keeping it.
- [x] Define one stable parse-failure contract for frontend and tests.
- [x] Define whether `needs_review` applies only to successful parses with low confidence.
- [x] Document the release gate for removing legacy matching fallback reads.

## Success Criteria

- Backend, frontend, tests, and docs all target one stable failure contract.
- No later phase needs to guess whether parse failure is persisted or rejected.

## Risk Assessment

- If this phase is skipped, backend and frontend will encode different meanings for parse failure.

## Security Considerations

- Do not expose provider-specific internal errors or raw model output directly to end users.
- Error mapping must avoid leaking key presence, stack traces, or secret names in API responses.

## Unresolved Questions

- Whether `needs_review` remains only for successful LLM parses with weak quality, or also covers partial repair output.
- Whether the single parse-failure contract still needs distinct internal logging categories even if the API response is unified.

## Next Steps

- Hand the locked error/status contract to Phases 2-4 before any implementation starts.
- Use the decision from this phase to update web copy, tests, and release messaging consistently.