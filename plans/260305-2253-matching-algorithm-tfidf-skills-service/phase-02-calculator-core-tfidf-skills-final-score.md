# Phase 2: Calculator Core (TF-IDF + Skills + Final Score)

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-matching-contract-and-scoring-baseline.md)
- [Docs: Matching Algorithm](../../docs/04-matching-algorithm.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Implement reusable pure calculators for TF-IDF, skills overlap, and weighted final score.

## Key Insights

- Pure functions are easier to test and reuse by applications flow.
- `natural.TfIdf` outputs term vectors; cosine similarity utility needed.
- Current codebase has no matching module yet, so structure can stay compact and focused.

## Requirements

### Functional

- Add text normalization helper:
  - lowercase
  - collapse whitespace
  - remove obvious punctuation noise
- Implement `calculateTfidfScore(cvText, jobText): number` (`0-1`).
- Implement `calculateSkillsScore(cvSkills, jobSkills): number` (`0-1`).
- Implement `calculateFinalScore(tfidfScore, skillsScore): number` (`0-100`, rounded).
- Implement breakdown helper:
  - `matchedSkills`
  - `missingSkills`

### Non-functional

- Clamp all floating outputs into valid ranges.
- Keep calculator functions side-effect free.
- Keep per-call runtime small for single match request.

## Architecture

```text
matching/
  calculators/
    tfidf-calculator.service.ts
    skills-calculator.service.ts
    score-combiner.service.ts
  utils/
    text-normalizer.ts
    cosine-similarity.ts
```

## Related Code Files

### Files To Modify

- None.

### Files To Create

- `apps/api/src/matching/calculators/tfidf-calculator.service.ts`
- `apps/api/src/matching/calculators/skills-calculator.service.ts`
- `apps/api/src/matching/calculators/score-combiner.service.ts`
- `apps/api/src/matching/utils/text-normalizer.ts`
- `apps/api/src/matching/utils/cosine-similarity.ts`
- `apps/api/src/matching/matching.types.ts`

### Files To Delete

- None.

## Implementation Steps

1. Implement text normalization utility.
2. Implement cosine similarity utility with sparse vectors.
3. Implement TF-IDF score service using `natural`.
4. Implement skills score + breakdown service.
5. Implement weighted combiner service with clamping and rounding.
6. Export shared matching result types.

## Todo List

- [x] Text normalization utility implemented.
- [x] TF-IDF calculator implemented.
- [x] Skills calculator + breakdown implemented.
- [x] Final score combiner implemented.
- [x] Types exported for service/controller usage.

## Success Criteria

- [x] Core score functions deterministic and testable.
- [x] Output stays within defined ranges.

## Risk Assessment

- **Risk:** unstable TF-IDF vector compare due to token noise.
- **Mitigation:** normalize input text consistently before vectorization.

## Security Considerations

- Avoid regex/pathological processing that can be exploited by very long text.
- Enforce max input text length before scoring.

## Next Steps

- Build API service/controller to load CV/Job data and call calculators.

## Unresolved Questions

- None.
