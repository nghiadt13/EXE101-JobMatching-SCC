# Phase 2: Atomic Skill Extraction And Canonicalization Pipeline

## Context Links

- [Plan Overview](./plan.md)
- [AI Normalization Service](../../apps/api/src/normalization/ai-normalization.service.ts)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)
- [Text Normalizer](../../apps/api/src/matching/utils/text-normalizer.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 8h

Replace grouped-skill handling with a deterministic extraction path that turns both parsed and manual skills into atomic canonical units. This phase fixes the root cause instead of patching the overlap calculator.

## Key Insights

- Current LLM prompt explicitly encourages grouped output like `AWS: EC2, S3, Lambda`, so overlap collapse starts before matching.
- Manual edits in CV and Job flows also store raw arrays without atomic normalization.
- Simple lowercase normalization is insufficient because grouped labels and separators survive as single tokens.

## Requirements

### Functional

- Split grouped skill strings into atomic units for CV and JD.
- Canonicalize common separators, casing, punctuation, and aliases.
- Reuse one extractor in CV parse, JD parse, CV update, and Job create/update.
- Preserve original labels for display and explanation.

### Non-Functional

- Deterministic and idempotent: running normalization twice should not duplicate atoms.
- Avoid LLM dependency for atomic splitting.
- Keep the first iteration dictionary-driven, not ontology-heavy.

## Architecture

```text
string[] input
  -> sanitize whitespace and separators
  -> split category prefix from child skills
  -> explode comma/slash/bullet groups into atomic labels
  -> alias canonicalization map
  -> dedupe by canonical key
  -> emit skillAtoms[] + display skills[]
```

## Related Code Files

### Files To Modify

- `apps/api/src/normalization/ai-normalization.service.ts`
- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/cvs/services/cv-parsing-normalizer.service.ts`
- `apps/api/src/matching/utils/text-normalizer.ts`

### Files To Create

- `apps/api/src/matching/services/skill-atomizer.service.ts`
- `apps/api/src/matching/services/skill-canonicalizer.service.ts`
- `apps/api/src/matching/fixtures/skill-aliases.json`
- `apps/api/src/matching/services/skill-atomizer.service.spec.ts`

### Files To Delete

- None.

## Implementation Steps

1. Remove the prompt instruction that asks the LLM to group granular skills under parent category strings.
2. Add deterministic post-processing that still handles grouped strings already produced by the LLM or entered manually.
3. Implement splitter rules for patterns like:
   - `Category: A, B, C`
   - `A/B/C`
   - `A | B | C`
   - bullets or semicolon lists collapsed into one string
4. Canonicalize labels with a small alias map for high-value variants:
   - `node.js` -> `nodejs`
   - `reactjs` -> `react`
   - `postgres` -> `postgresql`
   - `ts` should only map to `typescript` when token-safe
5. Emit both outputs:
   - `skillAtoms` for storage and matching.
   - `skills` array for UI-friendly labels.
6. Route all CV/JD create and update paths through the same helper so manual edits and AI parsing cannot diverge.
7. Add unit tests for grouped-string bugs, alias handling, idempotence, empty input, and mixed manual/AI inputs.

## Todo List

- [ ] Prompt guidance updated to stop encouraging grouped strings.
- [ ] Shared atomizer utility implemented.
- [ ] Canonical alias map introduced.
- [ ] CV and Job write paths use shared helper.
- [ ] Grouped-skill regression tests added.

## Success Criteria

- `AWS: EC2, S3, Lambda` yields separate atomic skills with preserved parent group.
- Existing grouped samples no longer collapse to zero overlap when obvious matches exist.
- Manual and AI-created records produce the same canonical skill representation.

## Risk Assessment

- **Risk:** Over-splitting turns one real skill into multiple false atoms.
- **Mitigation:** Start with conservative delimiters and test against real samples before broadening.

- **Risk:** Alias mapping creates false positives.
- **Mitigation:** Keep the alias list curated and short in the first release.

## Security Considerations

- Canonicalization must treat input as plain text only; never evaluate or deserialize untrusted content beyond JSON already accepted by the API.

## Next Steps

- Add database fields and backfill existing CV and Job rows with the canonical output.

## Unresolved Questions

- Whether to ship a recruiter-editable alias registry now or defer to a later admin feature.