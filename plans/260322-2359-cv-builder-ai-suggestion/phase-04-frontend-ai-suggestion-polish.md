# Phase 4: Frontend AI Suggestion Panel + Polish

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2: Frontend Builder](./phase-02-frontend-cv-builder-ui.md)
- [Phase 3: AI Suggestion Backend](./phase-03-backend-ai-cv-suggestion.md)

## Overview

**Priority:** P2
**Status:** Done
**Estimate:** 4h
**Depends on:** Phase 2 + Phase 3

Tích hợp AI suggestion panel vào CV builder UI, thêm responsive polish, và verify toàn bộ flow end-to-end.

## File Structure

```
apps/web/components/cv/builder/
├── ai-suggestion-panel.tsx          ← NEW: AI suggestion sidebar/drawer
├── suggestion-score-bar.tsx         ← NEW: circular score indicator
├── suggestion-keywords.tsx          ← NEW: missing keyword chips
├── suggestion-section-card.tsx      ← NEW: section suggestion card
└── suggestion-rewrite-card.tsx      ← NEW: before/after diff card

apps/web/lib/
└── api.ts                           ← MODIFY: add suggestCv() API call
```

## Requirements

### AI Suggestion Panel UI

```
┌── AI Gợi ý CV ────────────────────────────────────┐
│                                                     │
│  Chọn việc làm để so sánh:                         │
│  [▼ Dropdown: Published jobs               ]       │
│                                                     │
│  [🔍 Phân tích CV]                                 │
│                                                     │
│  ┌── Điểm phù hợp ──────────────────────────────┐ │
│  │  ██████████░░░░  72/100                        │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌── Từ khóa còn thiếu ─────────────────────────┐ │
│  │  [Docker] [Kubernetes] [CI/CD] [Microservices]│ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌── Điểm mạnh ─────────────────────────────────┐ │
│  │  ✅ Strong NestJS and TypeScript background   │ │
│  │  ✅ Relevant project experience               │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌── Gợi ý theo section ────────────────────────┐  │
│  │  🔴 Summary (High priority)                   │  │
│  │  • Thêm keyword 'microservices'              │  │
│  │  • Đề cập kinh nghiệm team lớn              │  │
│  │                                               │  │
│  │  🔴 Skills (High)                             │  │
│  │  • Thêm Docker, Kubernetes                   │  │
│  │                                               │  │
│  │  🟡 Experience (Medium)                       │  │
│  │  • Quantify thành tích                       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌── Gợi ý viết lại ────────────────────────────┐  │
│  │  📝 Summary                                   │  │
│  │  Before: "Lập trình viên backend có KN"      │  │
│  │  After:  "Backend Engineer với 3+ năm KN..." │  │
│  │  [Áp dụng] ← auto-fill vào form              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Integration Points

1. **Desktop**: Panel hiển thị bên phải preview (hoặc thay thế preview khi mở).
2. **Mobile**: Drawer từ dưới lên.
3. **"Áp dụng" button**: Cập nhật `cvData` state → form auto-fill → preview auto-update.
4. **Loading state**: Skeleton UI trong khi đợi LLM response (~5-15 giây).
5. **Error state**: Toast message nếu AI request fail.

### Job Dropdown

- Load danh sách jobs PUBLISHED via `GET /jobs?status=PUBLISHED&limit=50`
- Hiển thị: `${job.title} - ${job.company?.name ?? 'Unknown'}`
- Lưu selected job ID vào state

## Implementation Steps

### Step 1: API client (~15min)
- Add `suggestCv(cvId: string, jobId: string): Promise<CvSuggestion>` to `lib/api.ts`
- POST `/api/cvs/${cvId}/suggest` with body `{ jobId }`

### Step 2: Sub-components (~1.5h)
- `suggestion-score-bar.tsx`: circular/linear progress + score number
- `suggestion-keywords.tsx`: chips list with accent colors
- `suggestion-section-card.tsx`: collapsible card per section
- `suggestion-rewrite-card.tsx`: before/after diff + "Áp dụng" button

### Step 3: Main panel (~1.5h)
- `ai-suggestion-panel.tsx`:
  - Job dropdown (fetch published jobs)
  - "Phân tích CV" button → call API → loading → show results
  - Compose sub-components
  - "Áp dụng" handler → callback to parent setCvData

### Step 4: Integration into builder (~30min)
- Add panel toggle button in `cv-builder-form.tsx`: "💡 AI Gợi ý"
- Desktop: toggle between preview and suggestion panel
- Mobile: open as drawer/modal
- Pass `cvData` setter for "Áp dụng" functionality

### Step 5: Polish (~30min)
- Loading skeleton
- Error toast
- Empty state ("Chọn việc làm để bắt đầu")
- Responsive breakpoints

### Step 6: End-to-end verification (~1h)
```powershell
# Build
$env:AUTH_SECRET='test'; npm run build -w web
npm run lint -w web

# Manual test
# 1. Login candidate → create builder CV → save
# 2. Open AI suggestion → select job → analyze
# 3. Verify suggestions display
# 4. Click "Áp dụng" → verify form updates
# 5. Save → verify matching works with updated CV
```

## Todo List

- [x] `suggestCv()` API client function
- [x] Score bar component
- [x] Keywords chips component
- [x] Section suggestion card component
- [x] Rewrite diff card component
- [x] Main AI suggestion panel
- [x] Panel integrated into builder page
- [x] "Áp dụng" auto-fill working (summary section)
- [x] Loading skeleton + error handling
- [x] Responsive layout
- [ ] End-to-end flow verified

## Success Criteria

- [x] Candidate can select a job and get AI suggestions.
- [x] Score, missing keywords, and section suggestions display correctly.
- [x] "Áp dụng" updates form fields and preview updates in real-time.
- [x] Loading state shows during API call (~5-15s).
- [x] Error state handles LLM failures gracefully.
- [ ] Full flow: create CV → get suggestions → apply → save → apply to job via matching pipeline.

## Risk Assessment

- **Risk:** LLM response time >15 seconds causes poor UX.
- **Mitigation:** Show progress animation, set timeout at 60s, show partial results if available.

- **Risk:** "Áp dụng" overwrites user's careful edits.
- **Mitigation:** Only rewrite the specific field mentioned in suggestion, not entire section. Show confirmation before applying.
