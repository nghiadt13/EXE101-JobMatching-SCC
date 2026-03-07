# Phase 5: Tests, Env, Docs, Secret Rotation, And Rollout Checklist

## Context Links

- `job-matching/apps/api/src/normalization/ai-normalization.service.spec.ts`
- `job-matching/apps/api/src/cvs/cvs.service.spec.ts`
- `job-matching/apps/api/src/jobs/jobs.service.spec.ts`
- `job-matching/apps/api/src/matching/matching.service.spec.ts`
- `job-matching/README.md`
- `job-matching/docs/03-api-endpoints.md`
- `job-matching/docs/04-matching-algorithm.md`
- `job-matching/docs/05-implementation-checklist.md`

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 3h  
**Completed:** 2026-03-07

Close the change with validation, environment updates, doc cleanup, and secret handling so fallback behavior does not remain implied anywhere.

## Key Insights

- The repo README still documents Gemini-only setup and current AI behavior.
- Matching docs still normalize legacy fallback as an accepted mechanism.
- Secret rotation is operational work and easy to forget if not called out explicitly in the release gate.

## File Ownership

- `apps/api/src/normalization/ai-normalization.service.spec.ts`
- `apps/api/src/cvs/cvs.service.spec.ts`
- `apps/api/src/jobs/jobs.service.spec.ts`
- `apps/api/src/matching/matching.service.spec.ts`
- `README.md`
- `docs/03-api-endpoints.md`
- `docs/04-matching-algorithm.md`
- `docs/05-implementation-checklist.md`
- `apps/api/.env` (manual local update only)

## Requirements

- Cover provider success/failure paths.
- Cover upload failure UX mappings.
- Remove fallback references from docs and checklists.
- Rotate any checked-in AI secret and replace guidance with non-secret examples only.

## Architecture

- Validation layer: API specs and unit tests enforce explicit failure behavior.
- Documentation layer: env/setup/docs describe provider selection and failure semantics consistently.
- Release layer: rollout checklist blocks release on stale secrets, unbackfilled data, or tests still asserting fallback behavior.

## Related Code Files

- Modify: API tests covering normalization, CV, jobs, and matching behavior.
- Modify: `README.md`, `docs/03-api-endpoints.md`, `docs/04-matching-algorithm.md`, `docs/05-implementation-checklist.md`.
- Manual only: `apps/api/.env` or deployment secret store values for new provider keys.

## Implementation Steps

1. Update unit tests for explicit failure instead of fallback result creation.
2. Update matching tests to stop asserting legacy fallback reads.
3. Add web verification cases for upload/provider failure banners.
4. Update env docs for `OPENAI_API_KEY` and provider/model selection.
5. Rotate the exposed API secret outside source control and verify local env instructions do not embed real keys.

## Todo List

- [x] Update backend tests to assert explicit failures instead of fallback success.
- [x] Update matching tests to remove legacy fallback assumptions.
- [x] Add or document web verification for upload/provider failures.
- [x] Update setup/docs for direct OpenAI env and provider selection.
- [x] Record secret rotation and release gate checks.

## Success Criteria

- Tests and docs describe the same non-fallback behavior.
- Provider configuration is clear and safe.
- Release checklist explicitly blocks shipping with stale secrets or old fallback assumptions.

## Risk Assessment

- Docs drift will cause the team to reintroduce fallback expectations later.
- Secret rotation can be forgotten because it is operational, not code-level.

## Security Considerations

- No committed documentation should include live-looking provider secrets.
- Release instructions should require rotation of any previously exposed AI key before deployment.
- Test fixtures should not embed real uploaded CV/JD content if provider errors are snapshotted.

## Unresolved Questions

- Whether a sample env file should be added if the repo currently relies only on README instructions.

## Next Steps

- Treat this phase as the ship gate. Do not close the work until tests, docs, env instructions, and secret handling are all aligned.