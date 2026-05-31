# RAG Implementation Plan for 2 Agents

This plan splits the first RAG phase into two parallel workstreams. The goal is
to add retrieval in a controlled way without destabilizing the existing V2
matching pipeline.

## Guiding Principles

- Start with a small POC before changing final scoring.
- Prefer deterministic retrieval tests over live provider calls.
- Do not let retrieved context override CV/JD evidence.
- Keep RAG explainable: every retrieved item should have a source and reason.
- Compare before/after behavior with the mini eval plan before deeper
  integration.

## Recommended RAG Scope

Start with **skill taxonomy and role knowledge retrieval** rather than a broad
document chatbot.

Useful retrieval targets:

- Canonical skill aliases: `ReactJS -> React`, `Node -> Node.js`,
  `PostgreSQL -> Postgres`.
- Skill groups: frontend, backend, cloud, database, data, mobile.
- Related skills: `NestJS -> Node.js`, `Next.js -> React`, `Prisma -> ORM`.
- Role-level expectations: intern, junior, mid, senior.
- Certification/domain hints: AWS, Azure, language requirements, healthcare,
  finance, logistics.

Avoid in the first RAG phase:

- Letting RAG produce the final match score.
- Large vector DB infrastructure unless needed.
- Live LLM calls in unit tests.
- Unbounded retrieved text injected into the matching prompt.

## Agent Split

### Agent 1: Retrieval Foundation

Agent 1 owns the RAG data model, indexing, retrieval API, and deterministic
tests.

Primary goal:

- Build a small retrieval foundation that can return relevant skill/role
  context for a JD/CV pair.

Suggested write scope:

- `apps/api/src/matching/rag/**`
- `apps/api/src/matching/matching.module.ts`
- `apps/api/src/matching/docs/rag-implementation-phases.md`
- Test files under `apps/api/src/matching/rag/**`

Avoid editing:

- `JdDrivenEvaluationService` scoring weights.
- `AiNormalizationService` prompt integration, unless only adding types needed
  by Agent 2.
- Frontend.

#### Task 1.1: Define RAG Types

Create minimal types for retrieved matching context.

Suggested concepts:

- `RagKnowledgeItem`
  - `id`
  - `kind`: `skill_alias`, `skill_group`, `related_skill`, `role_expectation`,
    `domain_hint`
  - `title`
  - `content`
  - `tags`
  - `source`

- `RetrievedRagContext`
  - `items`
  - `queryTerms`
  - `warnings`

Acceptance criteria:

- Types are small and stable.
- Retrieved items carry source metadata.

#### Task 1.2: Add Seed Knowledge Source

Start with an in-code or JSON seed knowledge base. Keep it small.

Minimum dataset:

- 20-40 skill aliases.
- 10-15 related skill pairs.
- 5-8 role expectation items.
- 5-8 domain/certification hints.

Acceptance criteria:

- No network dependency.
- Easy to extend later.
- Tests can import it deterministically.

#### Task 1.3: Implement Deterministic Retriever

Implement a simple first retriever before vector search.

Suggested behavior:

- Extract terms from JD requirements, JD skills, CV skills, and raw text.
- Match against tags/title/content.
- Rank by overlap score.
- Return top N items with score/reason.

Acceptance criteria:

- No LLM call.
- No vector DB required.
- Deterministic tests pass.
- Handles empty input safely.

#### Task 1.4: Unit Tests

Add tests for:

- Skill alias retrieval.
- Related skill retrieval.
- Role expectation retrieval.
- Domain/certification hint retrieval.
- Empty query input.
- Ranking order.

Suggested prompt for Agent 1:

```text
You are Agent 1: Retrieval Foundation for RAG.

Build a deterministic, local RAG foundation for AI matching. Define small RAG
types, add a seed knowledge source for skill aliases/related skills/role
expectations/domain hints, and implement a retriever that returns ranked context
without any LLM or network calls. Add unit tests for retrieval quality and edge
cases.

Do not change scoring weights, do not integrate retrieved context into the LLM
prompt yet, and do not add vector DB infrastructure in this first pass.
Report changed files and verification commands.
```

### Agent 2: Integration + Eval Guardrails

Agent 2 owns how retrieved context is allowed to influence matching, plus eval
and documentation.

Primary goal:

- Prepare safe integration points and before/after evaluation without making
  RAG control final scoring.

Suggested write scope:

- `apps/api/src/matching/services/**`
- `apps/api/src/normalization/ai-normalization.service.ts`
- `apps/api/src/matching/docs/**`
- Tests for integration/prompt/eval fixtures.

Avoid editing:

- Agent 1's retriever implementation internals unless coordinating on types.
- Prisma setup.
- Package/dependency setup.

#### Task 2.1: Define Integration Contract

Decide how matching receives retrieved context.

Suggested integration:

- `MatchingService` or a dedicated orchestration service calls retriever.
- Retrieved context is passed into `AiNormalizationService.evaluateCvAgainstJd`
  as optional context.
- Prompt includes a compact "Retrieved Context" section.
- Prompt states retrieved context is advisory and must not override CV evidence.

Acceptance criteria:

- Existing call path still works without RAG context.
- Unit tests do not call LLM.
- Retrieved context is capped in size.

#### Task 2.2: Prompt Guardrails for RAG Context

Add prompt rules:

- Treat retrieved context as background knowledge, not candidate evidence.
- Do not mark a requirement as met only because retrieved context says skills
  are related.
- Candidate evidence must still come from CV text.
- Use retrieved context only to interpret aliases, related technologies, or role
  expectations.

Acceptance criteria:

- Prompt remains strict JSON.
- Tests verify the guardrail text is present.

#### Task 2.3: Mini Eval Extension

Extend `mini-eval-plan.md` with RAG-specific cases:

- Skill alias case: `ReactJS` vs `React`.
- Related skill case: `NestJS` implies Node.js ecosystem familiarity but not
  necessarily all Node.js requirements.
- Certification case: AWS project experience does not equal AWS certification.
- Keyword stuffing case remains not high even with related skill retrieval.

Acceptance criteria:

- Eval plan includes before/after expectations.
- Cases distinguish "interpretation help" from "evidence".

#### Task 2.4: Integration Tests with Mock Retriever

Add tests showing:

- Matching still works when retriever returns no context.
- RAG context is passed to the prompt builder/evaluation layer when available.
- RAG context does not bypass evidence validation.

Suggested prompt for Agent 2:

```text
You are Agent 2: RAG Integration + Eval Guardrails.

Design and implement the safe integration contract for retrieved context in the
AI matching pipeline. Retrieved context must be optional, capped, source-aware,
and advisory only. Add prompt guardrails saying RAG context cannot replace CV
evidence. Extend the mini eval plan with RAG-specific before/after cases and add
tests using mocks where needed.

Do not implement the retriever internals, do not change Prisma/package setup,
and do not let RAG directly control final scoring.
Report changed files, key decisions, and verification commands.
```

## Parallel Workflow

1. Agent 1 starts retrieval foundation.
2. Agent 2 starts by updating docs/eval and defining integration expectations.
3. Agent 1 exposes types and retriever service.
4. Agent 2 integrates using Agent 1's public contract.
5. Run full API tests and build after merging both.

Recommended merge order:

1. Merge Agent 1 first if it introduces shared types/service names.
2. Rebase Agent 2 on Agent 1.
3. Merge Agent 2.
4. Run integration verification.

## Final Integration Checklist

Before considering RAG phase 1 complete:

- `npm run test -w api -- --runInBand`
- `npm run build -w api`
- Retrieval tests are deterministic.
- No unit test calls a live LLM or network service.
- Retrieved context is capped.
- Retrieved context has source metadata.
- Prompt says retrieved context cannot replace CV evidence.
- Mini eval plan has RAG-specific cases.
- Existing non-RAG matching still works.

## When to Consider Vector Search

Only consider vector search after the deterministic POC proves useful.

Signals that vector search is worth adding:

- The knowledge base grows beyond simple tags/aliases.
- Exact/token overlap misses important related concepts.
- Mini eval before/after shows retrieval improves matching quality.
- There is a clear storage choice and operational plan.

Until then, keep phase 1 local and deterministic.
