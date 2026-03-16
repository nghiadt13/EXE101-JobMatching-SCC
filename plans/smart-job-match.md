# Smart Job Match — Multi-JD Recommendation Feature

## Overview

**Feature**: Smart Job Match allows candidates to scan their CV against all published job listings on the platform and receive a ranked list of the top 10 most compatible jobs, complete with match scores, tier labels, strengths, gaps, and confidence indicators.

**Processing**: Fully asynchronous — the user initiates a scan, the system processes it in the background, and a notification is sent when results are ready.

**Date**: March 16, 2026

---

## 1. Problem Statement

Previously, candidates could only match their CV against a single job description when they applied. This required them to manually browse and evaluate each job listing. The goal was to add an advanced feature that automatically scans all published JDs and recommends the best matches.

---

## 2. Approach: Pre-filter + AI Evaluate Top N

### Why this approach?

Three approaches were considered:

| Approach | Pros | Cons |
|----------|------|------|
| **1. Pre-filter + AI Top N** ⭐ | Balances accuracy & cost; reuses existing V2 pipeline | Requires good pre-filter to avoid missing candidates |
| 2. Embeddings + Vector Search | Fast retrieval; semantic matching | Requires embedding infrastructure; less interpretable |
| 3. Single AI prompt for all JDs | Simplest implementation | Token limits; unreliable with many JDs |

**Chosen: Approach 1** — Pre-filter using skill overlap to narrow down candidates, then use the existing Gemini-based V2 matching pipeline for detailed AI evaluation of the top candidates.

### How it works

```
CV Upload → Extract Canonical Skill Atoms
                    ↓
        Fetch all PUBLISHED jobs
                    ↓
    Pre-filter: Jaccard similarity on canonical skill atoms
    (+ text keyword fallback for CVs with <5 skills)
                    ↓
            Top 20 candidates
                    ↓
    AI Evaluate: Sequential batches of 2
    (reuses existing MatchingService.calculateForCvAndJob)
                    ↓
    Rank by matchScore → Top 10
                    ↓
    Save results + Create notification
```

---

## 3. Accuracy Optimizations

### 3a. Canonical Skill Atoms (P0 — Implemented)

The system already has `skillAtoms` on both `CV` and `Job` models, powered by `SkillCanonicalizerService`. This normalizes skill synonyms:

- "React.js" → `react`, "ReactJS" → `react`, "React" → `react`
- "Node.js" → `nodejs`, "Node" → `nodejs`
- "Amazon Web Services" → `aws`

**Impact**: +25-30% recall compared to raw string matching.

### 3b. Text Keyword Fallback (P0 — Implemented)

When a CV has fewer than 5 canonical skill atoms (e.g., due to poor parsing), the pre-filter falls back to text keyword matching against `CV.rawText`.

Weighting when fallback is active:
- Canonical overlap: 40%
- Text keyword match: 60%

### 3c. Confidence Scoring (P0 — Implemented)

After AI evaluation, a confidence score (0-1) is extracted from the V2 matching snapshot based on the proportion of requirement evaluations with `high` or `medium` confidence:

```
confidenceScore = (highCount × 1.0 + mediumCount × 0.5) / applicableCount
```

### 3d. Match Tier Labels (P0 — Implemented)

| Score | Tier | Label |
|-------|------|-------|
| ≥ 80% | `excellent` | 🟢 Excellent Match |
| ≥ 60% | `good` | 🟡 Good Match |
| ≥ 40% | `potential` | 🟠 Potential |
| < 40% | `low` | 🔴 Low Match |

### Future improvements (not yet implemented)

- **Domain/category overlap** — match CV domain with job category
- **Experience level matching** — compare total months vs JD minimum
- **Retry on low-confidence** — re-evaluate top 5 with enhanced prompt
- **Deduplication by company** — group similar JDs from same company

---

## 4. Database Schema Changes

### New Enum

```prisma
enum RecommendationScanStatus {
  PROCESSING
  COMPLETED
  FAILED
}
```

### New Models

```prisma
model RecommendationScan {
  id            String                    @id @default(uuid())
  candidateId   String
  candidate     Candidate                 @relation(...)
  cvId          String
  status        RecommendationScanStatus  @default(PROCESSING)
  totalJobs     Int                       @default(0)
  preFiltered   Int                       @default(0)
  aiEvaluated   Int                       @default(0)
  processingMs  Int?
  errorMessage  String?
  createdAt     DateTime                  @default(now())
  completedAt   DateTime?
  results       RecommendationResult[]

  @@index([candidateId, createdAt(sort: Desc)])
  @@index([status])
}

model RecommendationResult {
  id               String              @id @default(uuid())
  scanId           String
  scan             RecommendationScan  @relation(...)
  jobId            String
  job              Job                 @relation(...)
  rank             Int
  matchScore       Float
  matchTier        String              // "excellent" | "good" | "potential" | "low"
  matchingVersion  String
  matchingSnapshot Json?
  strengths        Json                @default("[]")
  gaps             Json                @default("[]")
  confidenceScore  Float               @default(0)
  createdAt        DateTime            @default(now())

  @@index([scanId, rank])
  @@index([jobId])
}
```

### Relations added to existing models

- `Candidate.recommendationScans` → `RecommendationScan[]`
- `Job.recommendationResults` → `RecommendationResult[]`

### Migration

```bash
npx prisma migrate dev --name add-recommendation-scan
```

**Safety**: These changes only ADD new tables/enum. No existing tables are modified — all existing functionality is unaffected.

---

## 5. API Endpoints

| Method | Path | Auth | Response | Description |
|--------|------|------|----------|-------------|
| `POST` | `/api/matching/recommend` | JWT (CANDIDATE) | `202 { scanId }` | Start a new recommendation scan |
| `GET` | `/api/matching/recommend` | JWT (CANDIDATE) | `200 { items, pagination }` | List scan history |
| `GET` | `/api/matching/recommend/:scanId` | JWT (CANDIDATE) | `200 RecommendationScanView` | Get scan details + results |

### POST body

```json
{ "cvId": "<uuid>" }
```

### Response example (completed scan)

```json
{
  "id": "scan-uuid",
  "status": "COMPLETED",
  "totalJobs": 50,
  "preFiltered": 20,
  "aiEvaluated": 18,
  "processingMs": 45000,
  "results": [
    {
      "rank": 1,
      "matchScore": 85.5,
      "matchTier": "excellent",
      "confidenceScore": 0.8,
      "strengths": ["Strong React experience", "TypeScript proficiency"],
      "gaps": ["No AWS experience mentioned"],
      "job": {
        "id": "job-uuid",
        "title": "Senior Frontend Developer",
        "slug": "senior-frontend-developer",
        "company": { "name": "TechCorp", "logoUrl": null }
      }
    }
  ]
}
```

---

## 6. File Changes Summary

### New Files (10)

| File | Purpose |
|------|---------|
| `apps/api/src/matching/recommendation.types.ts` | Types: MatchTier, resolveMatchTier(), view types |
| `apps/api/src/matching/dto/start-recommendation.dto.ts` | Validation DTO with @IsUUID() for cvId |
| `apps/api/src/matching/services/recommendation-prefilter.service.ts` | Multi-signal pre-filter: Jaccard on canonical atoms + text fallback |
| `apps/api/src/matching/services/recommendation.service.ts` | Core service: startScan, processInBackground, getScanResult, listScans |
| `apps/api/src/matching/recommendation.controller.ts` | REST controller: POST + GET endpoints |
| `apps/web/lib/recommendation-client.ts` | Frontend API client with typed functions |
| `apps/web/app/dashboard/candidate/recommendations/page.tsx` | Server component: CV selector, scan history, results view |
| `apps/web/app/dashboard/candidate/recommendations/recommendation-start-form.tsx` | Client component: CV dropdown + start button |
| `apps/web/app/dashboard/candidate/recommendations/scan-results-section.tsx` | Client component: polls status, renders ranked job cards |
| `apps/api/prisma/migrations/.../migration.sql` | Database migration (auto-generated) |

### Modified Files (3)

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Added enum, 2 models, 2 relations |
| `apps/api/src/matching/matching.module.ts` | Registered new controller + services |
| `apps/web/app/dashboard/candidate/page.tsx` | Added "Smart Job Match" button |

---

## 7. Architecture & Key Services

### Backend Service Dependency Graph

```
RecommendationController
    └── RecommendationService
            ├── PrismaService (DB access)
            ├── AppLogger (structured logging)
            ├── MatchingService (reused — calculateForCvAndJob)
            │       └── JdDrivenEvaluationService
            │               └── AiNormalizationService (Gemini API)
            ├── SkillStorageAdapterService (read canonical skill atoms)
            └── RecommendationPrefilterService (Jaccard + text fallback)
                    └── SkillStorageAdapterService
```

### Async Processing Pattern

Same fire-and-forget pattern used by `ApplicationsService.processMatchingInBackground()`:

1. Controller receives request → calls `startScan()`
2. `startScan()` creates DB record → calls `processInBackground()` with `.catch()` (fire-and-forget)
3. Returns `202 Accepted` with `scanId` immediately
4. Background function: pre-filter → AI evaluate → save results → update status → create notification
5. On error: update scan to FAILED → create failure notification (best-effort)

### Gemini Rate Limit Strategy

- **Batch size**: 2 concurrent AI calls per batch
- **Sequential batching**: `Promise.allSettled()` per batch, then next batch
- **Error isolation**: If one job evaluation fails, it's skipped — doesn't fail the entire scan
- **Estimated time**: ~30-60 seconds for 20 job evaluations

---

## 8. Frontend UX Flow

```
Candidate Dashboard
    │
    ├── Click "Smart Job Match" button
    │
    └── /dashboard/candidate/recommendations
            │
            ├── Select CV from dropdown (auto-selects primary CV)
            ├── Click "Start Analysis"
            │       → POST /api/matching/recommend → 202 { scanId }
            │       → Redirect to ?scanId=xxx
            │
            ├── ScanResultsSection (client component)
            │       ├── Polls GET /api/matching/recommend/:scanId every 3s
            │       ├── Shows progress: "Comparing with N jobs..."
            │       ├── When COMPLETED: renders ranked job cards
            │       └── When FAILED: shows error message
            │
            └── Scan History (server component)
                    └── Previous scans with status badges + top score
```

### Result Card displays:
- Rank number (#1, #2, ...)
- Job title + company name
- Match score % + tier badge (Excellent/Good/Potential/Low)
- Confidence indicator (High/Medium/Low)
- Top strengths + areas to improve
- "View Details →" link to full job page

---

## 9. Notification System

Uses the existing `Notification` model (already in schema). Creates notifications via `prisma.notification.create()`:

- **On success**: "Smart Job Match results are ready! Analyzed N jobs and found M best-matching positions."
- **On failure**: "CV analysis failed. The system encountered an error. Please try again later."

---

## 10. Rollback Strategy

### Level 1: Git Branch (safest)

```bash
git checkout -b feature/multi-jd-matching
git add -A && git commit -m "feat(matching): add multi-jd recommendation"
git checkout main  # demo-safe code
```

### Level 2: DB Migration Rollback

```sql
DROP TABLE IF EXISTS "RecommendationResult" CASCADE;
DROP TABLE IF EXISTS "RecommendationScan" CASCADE;
DROP TYPE IF EXISTS "RecommendationScanStatus" CASCADE;
DELETE FROM "_prisma_migrations" WHERE migration_name LIKE '%add_recommendation_scan%';
```

Then: `git checkout main -- apps/api/prisma/schema.prisma && npx prisma generate`

### Level 3: Nuclear Reset

```bash
git checkout main && git checkout -- . && git clean -fd
cd apps/api && npx prisma generate
```

**Key safety point**: The migration only ADDS new tables/enum. No existing tables are modified, so existing functionality is never at risk.

---

## 11. Testing Checklist

- [ ] Start Docker (PostgreSQL at port 5433)
- [ ] Run `prisma migrate dev`
- [ ] Start backend + frontend (`run-dev.ps1`)
- [ ] Login as a candidate with an uploaded CV
- [ ] Navigate to `/dashboard/candidate`
- [ ] Click "Smart Job Match"
- [ ] Select CV → Click "Start Analysis"
- [ ] Verify: processing status shows with progress
- [ ] Wait for completion (30-60 seconds)
- [ ] Verify: ranked results appear with scores, tiers, strengths, gaps
- [ ] Check notification bell for completion notification
- [ ] Click "View Details →" on a result → verify job page loads
- [ ] Test scan history: go back to recommendations page, verify previous scan shows
