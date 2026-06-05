# Fast-Track RAG Implementation Plan

Tai lieu nay thay the roadmap RAG dai hon. Muc tieu hien tai la dua RAG vao
luong matching that nhanh nhat co the, khong them database/vector search trong
giai doan nay.

## Current Baseline

Da co:

- `RagRetrieverService` local deterministic retrieval.
- RAG seed knowledge va RAG types.
- Unit tests cho retriever.
- `AiNormalizationService.evaluateCvAgainstJd(..., ragContext?)`.
- Prompt guardrails: RAG context chi la advisory knowledge.
- Evidence validation cho quote ngan va paraphrase.
- Full API test/build da xanh truoc khi bat dau phase tiep theo.

Before fast-track:

- `RagRetrieverService` chua duoc goi trong matching flow that.
- `JdDrivenEvaluationService` chua nhan/truyen `ragContext`.
- `MatchingService` chua build RAG retrieval input tu CV/JD.

## Current Progress

Done:

- Agent 1 contract is complete.
  - `JdDrivenEvaluationService.evaluate` accepts optional `ragContext`.
  - It preserves the 2-arg AI call when `ragContext` is absent.
  - It passes the 3rd arg when `ragContext` exists.
  - Focused test and API build passed after Agent 1 work.
- Agent 2 has started basic orchestration.
  - `RagRetrieverService` is injected into `MatchingService`.
  - Schema V2 path calls the retriever.
  - Schema V2 path passes a `ragContext` value into
    `JdDrivenEvaluationService.evaluate`.

Still required before done:

- Agent 2 must complete retrieval input coverage, failure handling, context
  formatting, and acceptance tests.
- Do not create final reports until all acceptance criteria below are met.

## Decision: Skip Heavy RAG Infrastructure for Now

Tam bo qua:

- Prisma migration cho RAG knowledge.
- Postgres/pgvector/vector DB.
- Snapshot metadata RAG.
- Offline eval runner.
- Knowledge admin UI.

Ly do:

- RAG local seed da du de kiem chung gia tri ban dau.
- Them DB/vector luc nay lam cham tien do va tang surface area.
- Buoc co ROI cao nhat hien tai la wire retriever vao matching V2.

Quay lai DB/vector chi khi:

- Local seed/tag retrieval khong con du.
- Mini eval/manual demo cho thay RAG co gia tri that.
- Can CRUD knowledge base thay vi sua seed trong code.

## Non-Negotiable Rules

- RAG context is optional. Non-RAG path must keep working.
- RAG context must be capped before entering the LLM prompt.
- RAG must not change scoring weights.
- LLM evidence must still come from candidate CV text.
- No live LLM/network calls in unit tests.
- If retrieval fails, matching should continue without RAG.

## Phase 2 Only - Wire Local RAG into Matching V2

Goal: Khi matching V2 chay, system lay local RAG context va truyen vao prompt
LLM nhu advisory context.

This is the only implementation phase to do now.

## Agent Split

### Agent 1: JdDrivenEvaluationService Contract - Done

Owner files:

- `apps/api/src/matching/services/jd-driven-evaluation.service.ts`
- `apps/api/src/matching/services/jd-driven-evaluation.service.spec.ts`

Tasks:

1. Extend `JdDrivenEvaluationService.evaluate` input:

```ts
{
  cvRawText: string;
  requirementsSchema: RequirementsSchemaV2;
  ragContext?: string;
}
```

2. Pass `ragContext` into:

```ts
this.aiNormalizationService.evaluateCvAgainstJd(
  cvRawText,
  requirementsSchema,
  ragContext,
);
```

3. Keep existing behavior when `ragContext` is absent.
4. Add unit tests:
   - no RAG context path still works.
   - with RAG context path passes third arg to AI service.
   - existing scoring/error behavior still works.

Do not:

- Change scoring weights.
- Change snapshot schema.
- Edit `MatchingService`.
- Edit Prisma/package setup.
- Edit retriever internals.

Acceptance criteria:

- Focused test passes:

```bash
npm run test -w api -- jd-driven-evaluation.service.spec.ts --runInBand
```

Suggested prompt:

```text
You are Agent 1 for Fast-Track RAG Phase 2.

Only update JdDrivenEvaluationService so it accepts optional ragContext and
passes it to AiNormalizationService.evaluateCvAgainstJd. Add unit tests for
with-RAG and without-RAG paths. Do not change scoring, snapshot schema,
MatchingService, Prisma, package files, or retriever internals. Run the focused
service test and report changed files.
```

### Agent 2: MatchingService Orchestration - Remaining Work

Owner files:

- `apps/api/src/matching/matching.service.ts`
- `apps/api/src/matching/matching.service.spec.ts`
- `apps/api/src/matching/matching.module.ts` only if DI setup needs adjustment

Current partial state:

- `MatchingService` currently calls `ragRetrieverService.retrieve`.
- Current retrieval input only uses `jdText` and `cvText`.
- Current formatted context only includes title/content.
- Current tests pass, but do not cover all required RAG behavior.

Remaining tasks:

1. Keep `RagRetrieverService` injected into `MatchingService`.
2. In schema V2 branch only, build complete `RagRetrievalInput` from:
   - `job.skills`.
   - requirement labels and keywords from `requirementsSchema`.
   - `cv.skills`.
   - `job.title + job.description`.
   - `cvRawText`.
3. Call `ragRetriever.retrieve(input)`.
4. Wrap retrieval in a local fallback:
   - if retrieval throws, continue matching without RAG.
   - do not fail the matching request because RAG failed.
5. Format retrieved items into a compact string.

Recommended format:

```text
- [skill_alias] ReactJS / React: ReactJS is an alias of React. Source: local_seed. Reason: Matched react.
- [related_skill] NestJS / Node.js: NestJS is a Node.js framework. Source: local_seed. Reason: Matched nestjs.
```

Each line should include:

- `item.kind`
- `item.title`
- `item.content`
- `item.source`
- retrieval `reason`

6. Pass the compact string as `ragContext` into
   `jdDrivenEvaluationService.evaluate`.
7. If no retrieved items, pass `undefined`.
8. Add or update unit tests:
   - V2 calls retriever.
   - V2 passes formatted RAG context to `JdDrivenEvaluationService`.
   - V2 still works when retriever returns no items.
   - V2 still works when retriever throws.
   - V1 path does not call retriever.
   - retrieval input includes job skills, requirement labels/keywords, CV
     skills, JD text, and CV raw text.

Do not:

- Change scoring weights.
- Change prompt text in `AiNormalizationService`.
- Add Prisma migration.
- Add vector DB.
- Add eval runner.
- Edit retriever internals unless strictly required by TypeScript.

Acceptance criteria:

- Focused test passes:

```bash
npm run test -w api -- matching.service.spec.ts --runInBand
```

Suggested prompt:

```text
You are Agent 2 for Fast-Track RAG Phase 2 completion.

Complete the remaining MatchingService RAG work. The current code already
injects RagRetrieverService and calls it in schema_v2, but it is incomplete.

Fix MatchingService so schema_v2 builds RagRetrievalInput from job skills,
requirement labels/keywords, CV skills, job title + description, and CV raw
text. Format retrieved items as compact advisory lines that include kind, title,
content, source, and reason. Pass the formatted string as ragContext to
JdDrivenEvaluationService.evaluate. If retrieval returns no items, pass
undefined. If retrieval throws, continue matching without RAG.

Add tests in matching.service.spec.ts for: V2 calls retriever, V2 passes
formatted RAG context, empty retrieval works, retriever failure works, V1 does
not call retriever, and retrieval input contains job skills, requirement
labels/keywords, CV skills, JD text, and CV raw text.

Do not change scoring, AiNormalizationService prompt text, Prisma, package
files, vector DB, snapshot schema, or retriever internals. Do not create report
docs. Run matching.service.spec.ts and report changed files.
```

## Human Review After Both Agents Finish

Review these points:

- Is the formatted RAG context short and clearly advisory?
- Does V1 remain untouched?
- Does V2 work when RAG returns no items?
- Does V2 work when RAG throws?
- Did either agent change scoring weights, Prisma, package files, or prompt
  rules unexpectedly?

Required verification:

```bash
npm run test -w api -- jd-driven-evaluation.service.spec.ts --runInBand
npm run test -w api -- matching.service.spec.ts --runInBand
npm run test -w api -- --runInBand
npm run build -w api
```

## Definition of Done for This Fast Track

RAG fast-track is done when:

- V2 matching automatically retrieves local RAG context.
- Retrieved context reaches the LLM prompt through `ragContext`.
- Existing matching works without RAG.
- Existing matching works if retriever fails.
- V1 matching does not call RAG.
- Full API tests pass.
- API build passes.

## Deferred Work

Do not start these until the fast-track version is merged and manually checked:

- Persist RAG knowledge with Prisma.
- Add pgvector/vector DB.
- Add `matchingSnapshot.rag` metadata.
- Add offline eval fixtures/runner.
- Build UI/admin tools for knowledge management.
