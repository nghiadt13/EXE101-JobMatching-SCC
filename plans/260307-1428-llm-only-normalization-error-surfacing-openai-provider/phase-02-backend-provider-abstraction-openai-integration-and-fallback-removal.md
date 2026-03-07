# Phase 2: Backend Provider Abstraction, OpenAI Integration, And Fallback Removal

## Context Links

- `job-matching/apps/api/src/normalization/ai-normalization.service.ts`
- `job-matching/apps/api/src/normalization/gemini-client.service.ts`
- `job-matching/apps/api/src/normalization/normalization.module.ts`
- `job-matching/apps/api/src/normalization/normalization.types.ts`
- `job-matching/apps/api/src/cvs/services/cv-ai-parser.service.ts`
- `job-matching/apps/api/src/cvs/services/cv-parsing-normalizer.service.ts`

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 5h  
**Completed:** 2026-03-07

Replace Gemini-only coupling with a minimal provider boundary, add one OpenAI-backed provider, and remove fallback parse generation from active AI services.

## Key Insights

- The current normalization service owns prompt building, JSON extraction/repair, and fallback result generation in one place.
- Gemini transport is currently hardcoded and selected implicitly by env presence.
- `CvAiParserService` and normalization services can drift if fallback logic is removed in only one path.

## File Ownership

- `apps/api/src/normalization/ai-normalization.service.ts`
- `apps/api/src/normalization/gemini-client.service.ts`
- `apps/api/src/normalization/normalization.module.ts`
- `apps/api/src/normalization/ai-normalization.service.spec.ts`
- `apps/api/src/cvs/services/cv-ai-parser.service.ts`
- `apps/api/src/cvs/cvs.module.ts`
- `apps/api/package.json`

### Likely New Files

- `apps/api/src/normalization/openai-client.service.ts`
- `apps/api/src/normalization/llm-client.interface.ts`

## Requirements

- Keep one prompt/JSON validation/normalization path in `AiNormalizationService`.
- Move provider-specific transport to thin client services.
- Add one new env key for direct OpenAI and keep model selection env-driven.
- Remove fallback profile generation and fallback parse generation from active paths.

## Architecture

- Keep `AiNormalizationService` as the single owner of prompt creation, JSON parsing, repair strategy, and normalized output shaping.
- Introduce one provider client interface implemented by Gemini and OpenAI transport services.
- Resolve provider/model selection in one place, ideally module wiring or one small factory/provider.
- Treat missing key, timeout, transport failure, and invalid model output as explicit exceptions mapped later by controllers/services.

## Related Code Files

- Modify: `apps/api/src/normalization/ai-normalization.service.ts`, `gemini-client.service.ts`, `normalization.module.ts`.
- Modify: `apps/api/src/cvs/services/cv-ai-parser.service.ts` if still on a live path.
- Modify: `apps/api/package.json` if `openai` dependency is not already present.
- Create: `apps/api/src/normalization/openai-client.service.ts` and one small provider interface/factory file.

## Implementation Steps

1. Introduce a small provider client contract with `generateText`-style behavior.
2. Keep Gemini client as one implementation; add direct OpenAI client as second implementation.
3. Select provider/model from env at module/service boundary.
4. Replace `createFallbackResult`, `forceFallback*`, and parser fallback return paths with explicit errors.
5. Keep JSON repair only if it remains LLM-backed and not heuristic fallback logic.
6. Update tests for missing key, invalid JSON, timeout, and provider exception behavior.

## Todo List

- [x] Add provider abstraction with exactly one shared text-generation contract.
- [x] Add direct OpenAI client with `OPENAI_API_KEY` and model env configuration.
- [x] Remove `createFallbackResult` and any equivalent degraded-success path.
- [x] Verify parser services do not silently synthesize parse payloads after provider failures.
- [x] Cover error scenarios in unit tests.

## Success Criteria

- Active ingestion code is LLM-only.
- Provider swap does not require prompt duplication or branch-heavy service code.
- Missing/invalid provider behavior returns explicit failure, not synthetic parsed data.

## Risk Assessment

- `CvAiParserService` may become redundant or conflict with normalization service ownership.
- Provider selection can sprawl if both model and provider logic leak into domain services.

## Security Considerations

- Provider keys must come from env only. No sample real keys in committed files.
- OpenAI/Gemini error logging should be sanitized so request payloads and secrets are not leaked.
- If request/response logging exists, raw uploaded document text must not be dumped during failures.

## Unresolved Questions

- Whether the old parser service should be migrated, bypassed, or deleted.

## Next Steps

- Feed explicit backend error types/codes into Phase 4 so web UX can map them deterministically.
- Confirm final env variable names before docs and rollout tasks begin.