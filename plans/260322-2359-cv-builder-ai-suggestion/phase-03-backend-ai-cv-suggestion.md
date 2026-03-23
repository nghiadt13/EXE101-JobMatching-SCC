# Phase 3: Backend AI CV Suggestion Service

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1: Backend API](./phase-01-prisma-schema-backend-cv-builder-api.md)
- [Existing: AiNormalizationService](../../apps/api/src/normalization/ai-normalization.service.ts)
- [Existing: GeminiClientService](../../apps/api/src/normalization/gemini-client.service.ts)

## Overview

**Priority:** P2
**Status:** Done
**Estimate:** 4h
**Depends on:** Phase 1

Tạo AI service gọi LLM để phân tích CV vs JD → trả gợi ý cải thiện CV (missing keywords, rewrite suggestions, section-by-section feedback).

## Key Insights

- `GeminiClientService.generateText(prompt, timeoutMs)` đã exist → reuse trực tiếp.
- `AiNormalizationService.resolveClient()` chọn provider (gemini/kimi) theo env → reuse.
- `AiNormalizationService.extractJson()` parse JSON từ LLM response → reuse.
- Job's `requirementsSchema` đã có structured requirements (must-haves, nice-to-haves) → dùng làm input cho suggestion.
- CV `rawText` đã có sẵn (cả upload và builder) → dùng làm input.

## Architecture

```text
Client
  │
  POST /cvs/:id/suggest  { "jobId": "uuid" }
  │
  └─ CvsController.suggest()
      └─ CvSuggestionService.suggest(userId, cvId, jobId)
          ├─ Load CV rawText from DB
          ├─ Load Job requirementsSchema from DB
          ├─ Validate: CV ownership, Job is PUBLISHED
          ├─ Build LLM prompt
          ├─ Call GeminiClient.generateText()
          ├─ Parse + normalize JSON response
          └─ Return CvSuggestion
```

## API Contract

### `POST /cvs/:id/suggest`

**Auth:** `JwtAuthGuard` + `RolesGuard(CANDIDATE)`

**Request:**
```json
{ "jobId": "uuid" }
```

**Response (CvSuggestion):**
```json
{
  "overallScore": 72,
  "missingKeywords": ["Docker", "Kubernetes", "CI/CD"],
  "strengthHighlights": [
    "Strong NestJS and TypeScript background",
    "Relevant project experience with similar tech stack"
  ],
  "sections": [
    {
      "section": "summary",
      "suggestions": [
        "Thêm keyword 'microservices' vào mục tiêu nghề nghiệp",
        "Đề cập kinh nghiệm làm việc với team lớn"
      ],
      "priority": "high"
    },
    {
      "section": "skills",
      "suggestions": [
        "Thêm Docker và Kubernetes nếu có kinh nghiệm",
        "Tách 'JavaScript' thành 'TypeScript' cụ thể hơn"
      ],
      "priority": "high"
    },
    {
      "section": "experience",
      "suggestions": [
        "Quantify thành tích: thêm con số cụ thể (%, số lượng user, etc.)",
        "Đề cập tech stack sử dụng trong mỗi dự án"
      ],
      "priority": "medium"
    }
  ],
  "rewriteSuggestions": [
    {
      "section": "summary",
      "original": "Lập trình viên backend có kinh nghiệm",
      "suggested": "Backend Engineer với 3+ năm kinh nghiệm phát triển microservices bằng NestJS/TypeScript, passionate about scalable system design",
      "reason": "JD yêu cầu 'microservices experience' và 'scalable systems'"
    }
  ]
}
```

**Error Codes:**

| Code | Condition |
|------|-----------|
| `400` | Missing `jobId` in body |
| `401` | Not authenticated |
| `403` | Not CANDIDATE |
| `404` | CV not found, or Job not PUBLISHED |
| `422` | AI suggestion failed (LLM error) |
| `503` | AI service unavailable |

## Related Code Files

### Files To Create

| File | Purpose |
|------|---------|
| `apps/api/src/cvs/services/cv-suggestion.service.ts` | AI suggestion service |
| `apps/api/src/cvs/dto/suggest-cv.dto.ts` | DTO with `jobId` |
| `apps/api/src/cvs/cv-suggestion.types.ts` | Response types |

### Files To Modify

| File | Change |
|------|--------|
| `apps/api/src/cvs/cvs.controller.ts` | Add `POST :id/suggest` endpoint |
| `apps/api/src/cvs/cvs.module.ts` | Register `CvSuggestionService`, import `NormalizationModule` |

## Implementation Steps

### Step 1: Types + DTO (~30min)
- Create `cv-suggestion.types.ts`: `CvSuggestion`, `SectionSuggestion`, `RewriteSuggestion`
- Create `suggest-cv.dto.ts`: `SuggestCvDto { @IsUUID() jobId: string }`

### Step 2: Service (~2h)
- Create `cv-suggestion.service.ts`
- Inject `GeminiClientService` (or use `resolveClient()` pattern), `PrismaService`, `AppLogger`
- Method `suggest(userId, cvId, jobId)`:
  1. Load CV (check ownership, get rawText)
  2. Load Job (check PUBLISHED, get requirementsSchema)
  3. Build prompt with CV rawText + job requirements
  4. Call LLM with timeout
  5. Parse JSON → normalize → return `CvSuggestion`
- LLM prompt template should ask for structured JSON matching `CvSuggestion` interface
- Use `extractJson()` pattern from `AiNormalizationService`

### Step 3: Controller endpoint (~30min)
- Add `@Post(':id/suggest')` → `CvSuggestionService.suggest()`
- Place after existing endpoints, before catch-all

### Step 4: Module wiring (~15min)
- Add `CvSuggestionService` to `CvsModule.providers`
- Import `NormalizationModule` in `CvsModule` (for `GeminiClientService`)

### Step 5: Testing (~45min)
- Unit test: prompt building, response normalization
- Integration: mock LLM, verify full flow
```powershell
npm run test -w api -- --testPathPattern=cv-suggestion --runInBand
npm run build -w api
```

## Todo List

- [x] `CvSuggestion` types defined
- [x] `SuggestCvDto` created
- [x] `CvSuggestionService` with LLM prompt + normalization
- [x] Controller endpoint wired
- [x] Module updated
- [ ] Tests written + passing

## Success Criteria

- [x] `POST /cvs/:id/suggest` returns structured suggestions.
- [x] Suggestions reference actual JD requirements.
- [x] Missing keywords are relevant to the JD.
- [x] Rewrite suggestions are specific and actionable.
- [x] Error handling for LLM failures works correctly.

## Next Steps

- Phase 4: Frontend AI suggestion panel integrated into builder UI.
