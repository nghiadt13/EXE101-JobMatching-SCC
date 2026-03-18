# Smart Job Match — Multi-JD Recommendation Feature

> **Date**: March 16, 2026  
> **Status**: Implemented (pending E2E testing)  
> **Migration**: `add-recommendation-scan`  

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Approach Comparison & Decision](#2-approach-comparison--decision)
3. [System Architecture](#3-system-architecture)
4. [Accuracy Deep-Dive](#4-accuracy-deep-dive)
5. [Database Schema Changes](#5-database-schema-changes)
6. [Backend Implementation](#6-backend-implementation)
7. [Frontend Implementation](#7-frontend-implementation)
8. [API Reference](#8-api-reference)
9. [Async Processing Pipeline](#9-async-processing-pipeline)
10. [Notification System](#10-notification-system)
11. [Constraints & Rate Limits](#11-constraints--rate-limits)
12. [Rollback Strategy](#12-rollback-strategy)
13. [Testing Guide](#13-testing-guide)
14. [Future Improvements](#14-future-improvements)

---

## 1. Problem Statement

### Before

- Candidates can only match their CV against **one single job** when they click "Apply".
- Requires manual browsing through all job listings, reading each JD, guessing if it's a good fit.
- No way to get a ranked list of best-matching jobs automatically.

### After (Smart Job Match)

- Candidates click **"Start Analysis"** → the system automatically scans their CV against **all published jobs** on the platform.
- Returns a **ranked top 10** of the best-matching positions with:
  - Match score percentage (e.g. 85%)
  - Tier label (Excellent / Good / Potential / Low)
  - Confidence indicator (High / Medium / Low)
  - Specific strengths (what makes the candidate a good fit)
  - Specific gaps (what the candidate is missing)
- Processing runs **asynchronously** — candidate gets a **notification** when results are ready.

### Availability

- Available for **all plan types** (no premium gate).
- Only available to users with role `CANDIDATE`.

---

## 2. Approach Comparison & Decision

Three approaches were evaluated:

| # | Approach | How it works | Pros | Cons |
|---|----------|-------------|------|------|
| **1** | **Pre-filter + AI Evaluate Top N** ⭐ | Use skill atom overlap to narrow to ~20 jobs, then run Gemini AI matching on each | Reuses existing V2 pipeline; balances accuracy & API cost; interpretable results | Requires good pre-filter to avoid missing good matches |
| 2 | Embeddings + Vector Search | Generate vector embeddings for CV and all JDs, find nearest neighbors | Fast retrieval; semantic matching | Requires additional infrastructure (vector DB); less interpretable scores |
| 3 | Single AI Prompt for all JDs | Send all JDs to Gemini in one prompt, ask it to rank | Simplest implementation | Token limits hit quickly (~50+ JDs); output unreliable; expensive |

### Decision: Approach 1

**Rationale:**
- The project already has a V2 matching pipeline (`MatchingService.calculateForCvAndJob`) using Gemini for requirement-by-requirement evaluation → reuse it directly.
- The project already has `skillAtoms` on `CV` and `Job` models with a `SkillCanonicalizerService` for synonym normalization → reuse for pre-filtering.
- No new infrastructure needed (no vector DB, no new AI endpoints).
- Results are fully interpretable with per-requirement breakdowns.

---

## 3. System Architecture

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                          │
│                                                                  │
│  /dashboard/candidate/recommendations                            │
│  ┌─────────────────────┐    ┌────────────────────────────────┐   │
│  │ RecommendationStart │    │ ScanResultsSection             │   │
│  │ Form                │    │ (polls GET /recommend/:scanId) │   │
│  │ - CV dropdown       │    │ - PROCESSING → progress bars   │   │
│  │ - "Start Analysis"  │    │ - COMPLETED → ranked job cards │   │
│  │   → POST /recommend │    │ - FAILED → error message       │   │
│  └─────────────────────┘    └────────────────────────────────┘   │
│                                                                  │
│  recommendation-client.ts (typed API functions)                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP (JWT Auth)
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS)                            │
│                                                                  │
│  RecommendationController                                        │
│  ├── POST /api/matching/recommend    → startScan()               │
│  ├── GET  /api/matching/recommend    → listScans()               │
│  └── GET  /api/matching/recommend/:id → getScanResult()          │
│                                                                  │
│  RecommendationService                                           │
│  ├── startScan() → creates DB record → fires processInBackground │
│  ├── processInBackground() → prefilter → AI eval → save results  │
│  ├── getScanResult() → returns scan + ranked results             │
│  └── listScans() → paginated scan history                        │
│                                                                  │
│  RecommendationPrefilterService                                  │
│  └── rankJobs() → Jaccard similarity on skill atoms              │
│                   + text keyword fallback                         │
│                                                                  │
│  MatchingService (existing, reused)                               │
│  └── calculateForCvAndJob() → full V2 AI evaluation via Gemini   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                        │
│                                                                  │
│  RecommendationScan    → tracks scan status + metadata           │
│  RecommendationResult  → stores per-job ranked results           │
│  Notification          → completion/failure notifications        │
└──────────────────────────────────────────────────────────────────┘
```

### Service Dependency Graph

```
RecommendationController
    └── RecommendationService
            ├── PrismaService           — Database access
            ├── AppLogger               — Structured logging
            ├── SkillStorageAdapterService — Reads skillAtoms from Json
            ├── RecommendationPrefilterService
            │       └── SkillStorageAdapterService
            └── MatchingService (existing, reused)
                    ├── JdDrivenEvaluationService
                    │       └── AiNormalizationService → Gemini API
                    ├── CandidateProfileService
                    ├── JobRequirementsSchemaService
                    └── SchemaMatchingEvaluatorService
```

---

## 4. Accuracy Deep-Dive

### 4.1 Canonical Skill Atoms (Primary Signal)

The system already has a `SkillCanonicalizerService` that normalizes skill name synonyms into canonical forms:

| Raw Skill | Canonical |
|-----------|-----------|
| React.js, ReactJS, React | `react` |
| Node.js, NodeJS, Node | `nodejs` |
| Amazon Web Services, AWS | `aws` |
| TypeScript, TS | `typescript` |
| PostgreSQL, Postgres | `postgresql` |

Both `CV.skillAtoms` and `Job.skillAtoms` store these canonicalized atoms as JSON arrays.

**Pre-filter formula**: Jaccard Similarity

```
Jaccard(CV, Job) = |CV_skills ∩ Job_skills| / |CV_skills ∪ Job_skills|
```

**Example:**
- CV skills: `{react, typescript, nodejs, postgresql, docker}`
- Job skills: `{react, typescript, aws, postgresql, graphql}`
- Intersection: `{react, typescript, postgresql}` → 3
- Union: `{react, typescript, nodejs, postgresql, docker, aws, graphql}` → 7
- Score: 3/7 = 0.43

**Impact**: +25-30% recall compared to raw string matching (e.g., "React.js" vs "ReactJS" would fail with raw matching but succeeds with canonical atoms).

### 4.2 Text Keyword Fallback

When a CV has **fewer than 5 canonical skill atoms** (e.g., due to poor PDF parsing or non-standard CV format), the pre-filter activates a text keyword fallback:

1. Extracts keywords from the job's `skills` array and `description` text
2. For description, it picks words that are likely technical: capitalized words or words containing `.`, `#`, `+` characters
3. Checks how many of these keywords appear in the CV's `rawText`

**Weighting when fallback is active:**
- Canonical skill overlap: **40%**
- Text keyword match: **60%**

**When fallback is NOT active** (CV has ≥5 skill atoms): only canonical skill overlap is used (100%).

### 4.3 AI Evaluation via Existing V2 Pipeline

After pre-filtering to the top 20, each job is evaluated using the **existing** `MatchingService.calculateForCvAndJob()` method which:

1. Retrieves the job's `requirementsSchema` (structured requirements generated by Gemini)
2. Retrieves the CV's `candidateProfile` (structured profile generated by Gemini)
3. Sends both to Gemini 2.5 Flash for a detailed requirement-by-requirement evaluation
4. Returns: `{ score, matchingVersion, matchingSnapshot }` where:
   - `score`: 0-100 percentage
   - `matchingVersion`: `'schema_v1'` or `'schema_v2'`
   - `matchingSnapshot`: full breakdown including requirements, strengths, gaps, constraints

### 4.4 Confidence Score Calculation

Extracted from the V2 matching snapshot's `requirements` array:

```typescript
confidenceScore = (highCount × 1.0 + mediumCount × 0.5) / applicableCount
```

Where:
- `highCount` = requirements evaluated with `confidence: 'high'`
- `mediumCount` = requirements evaluated with `confidence: 'medium'`
- `applicableCount` = all requirements except `status: 'not_applicable'`

**UI Display Logic** (combines both matchScore and confidenceScore):
| Condition | Display |
|-----------|---------|
| `matchScore ≥ 60` AND `confidenceScore ≥ 0.7` | **High** |
| `matchScore ≥ 40` AND `confidenceScore ≥ 0.4` | **Medium** |
| Otherwise | **Low** |

### 4.5 Match Tier Labels

| Score Range | Tier Key | UI Label | Emoji | Card Background |
|-------------|----------|----------|-------|-----------------|
| ≥ 80% | `excellent` | Excellent Match | 🟢 | `bg-emerald-50 border-emerald-200` |
| ≥ 60% | `good` | Good Match | 🟡 | `bg-amber-50 border-amber-200` |
| ≥ 40% | `potential` | Potential | 🟠 | `bg-orange-50 border-orange-200` |
| < 40% | `low` | Low Match | 🔴 | `bg-red-50 border-red-200` |

### 4.6 Strengths & Gaps Extraction

From the matching snapshot:
- **Strengths**: `snapshot.strengths[]` → top 4 items displayed
- **Gaps**: `snapshot.gaps[]` → top 3 items displayed

These are strings generated by Gemini during the V2 evaluation, e.g.:
- Strength: "Strong React experience with 3+ years"
- Gap: "No AWS experience mentioned in CV"

---

## 5. Database Schema Changes

### New Enum

```prisma
// File: apps/api/prisma/schema.prisma (line 252-256)

enum RecommendationScanStatus {
  PROCESSING
  COMPLETED
  FAILED
}
```

### New Model: RecommendationScan

```prisma
// File: apps/api/prisma/schema.prisma (line 258-276)

model RecommendationScan {
  id            String                    @id @default(uuid())
  candidateId   String
  candidate     Candidate                 @relation(fields: [candidateId], references: [id], onDelete: Cascade)
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
```

**Field explanations:**
| Field | Type | Purpose |
|-------|------|---------|
| `candidateId` | FK → Candidate | Who initiated the scan |
| `cvId` | String | Which CV was used (not FK — CV could be deleted later) |
| `status` | Enum | `PROCESSING` → `COMPLETED` or `FAILED` |
| `totalJobs` | Int | How many published jobs existed at scan time |
| `preFiltered` | Int | How many passed the pre-filter stage |
| `aiEvaluated` | Int | How many were successfully AI-evaluated |
| `processingMs` | Int? | Total processing time in milliseconds |
| `errorMessage` | String? | Error message if `FAILED` |
| `completedAt` | DateTime? | When processing finished (success or failure) |

### New Model: RecommendationResult

```prisma
// File: apps/api/prisma/schema.prisma (line 278-296)

model RecommendationResult {
  id               String              @id @default(uuid())
  scanId           String
  scan             RecommendationScan  @relation(fields: [scanId], references: [id], onDelete: Cascade)
  jobId            String
  job              Job                 @relation(fields: [jobId], references: [id], onDelete: Cascade)
  rank             Int
  matchScore       Float
  matchTier        String
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

**Field explanations:**
| Field | Type | Purpose |
|-------|------|---------|
| `scanId` | FK → RecommendationScan | Which scan this result belongs to |
| `jobId` | FK → Job | Which job was evaluated |
| `rank` | Int | Position in the ranked list (1 = best match) |
| `matchScore` | Float | 0-100 percentage score |
| `matchTier` | String | `"excellent"`, `"good"`, `"potential"`, or `"low"` |
| `matchingVersion` | String | `"schema_v1"` or `"schema_v2"` |
| `matchingSnapshot` | Json? | Full V2 snapshot (requirements breakdown, etc.) |
| `strengths` | Json | Array of strength strings, e.g. `["Strong React experience"]` |
| `gaps` | Json | Array of gap strings, e.g. `["No AWS experience"]` |
| `confidenceScore` | Float | 0-1 confidence score |

### Relations Added to Existing Models

```prisma
// In model Candidate (line 66):
recommendationScans RecommendationScan[]

// In model Job (line 125-126):
recommendationResults RecommendationResult[]
```

### Safety Note

> **These changes ONLY ADD new tables and a new enum. No existing tables or columns are modified.** All existing functionality (users, jobs, applications, CVs, matching) remains completely untouched.

---

## 6. Backend Implementation

### 6.1 File: `apps/api/src/matching/recommendation.types.ts`

**Purpose**: Shared types and utility functions.

```typescript
export type MatchTier = 'excellent' | 'good' | 'potential' | 'low';

export function resolveMatchTier(score: number): MatchTier {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'potential';
  return 'low';
}

export const MATCH_TIER_LABELS: Record<MatchTier, string> = {
  excellent: 'Excellent Match',
  good: 'Good Match',
  potential: 'Potential',
  low: 'Low Match',
};
```

Also exports TypeScript interfaces: `RecommendationResultView`, `RecommendationScanView`, `RecommendationScanListItem`.

### 6.2 File: `apps/api/src/matching/dto/start-recommendation.dto.ts`

**Purpose**: Request validation for scan start endpoint.

```typescript
import { IsUUID } from 'class-validator';

export class StartRecommendationDto {
  @IsUUID()
  cvId: string;
}
```

### 6.3 File: `apps/api/src/matching/services/recommendation-prefilter.service.ts`

**Purpose**: Pre-filter all published jobs down to the most relevant ~20 using canonical skill atom overlap.

**Key type:**
```typescript
export type PrefilterJobRecord = {
  id: string;
  title: string;
  description: string;
  skills: Prisma.JsonValue;
  skillAtoms: Prisma.JsonValue;
  requirementsSchema: Prisma.JsonValue | null;
  location: Prisma.JsonValue | null;
  recruiterId: string;
};
```

**Key method: `rankJobs()`**
- Input: CV's canonical skill atoms, raw text, all published jobs, limit
- Decides: use text fallback? (`cvCanonicals.size < 5`)
- For each job: computes Jaccard score on canonical atoms ± text keyword score
- Sorts by combined score descending
- Returns top `limit` jobs

**Key method: `jaccardSimilarity(setA, setB)`**
- Returns `|A ∩ B| / |A ∪ B|`
- Range: 0.0 (no overlap) to 1.0 (identical sets)

**Key method: `textKeywordMatch(cvRawText, jobSkills, jobDescription)`**
- Merges job `skills` array + technical keywords from `description`
- Counts how many appear in CV raw text
- Returns `hits / totalKeywords`

### 6.4 File: `apps/api/src/matching/services/recommendation.service.ts`

**Purpose**: Core orchestration service. 558 lines.

**Constants:**
```typescript
const AI_BATCH_SIZE = 2;       // Max concurrent Gemini calls per batch
const PRE_FILTER_LIMIT = 20;   // How many jobs to send for AI evaluation
const MAX_RESULTS = 10;        // Top N results to save
```

**Dependencies injected:**
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly logger: AppLogger,
  private readonly matchingService: MatchingService,
  private readonly skillStorageAdapter: SkillStorageAdapterService,
  private readonly prefilterService: RecommendationPrefilterService,
)
```

**Public methods:**

| Method | Purpose |
|--------|---------|
| `startScan(cvId, actor)` | Validates user (must be CANDIDATE), validates CV exists, creates DB record, fires background processing, returns `{ scanId }` |
| `getScanResult(scanId, actor)` | Returns full scan + results (with job details including company) |
| `listScans(actor, page, limit)` | Paginated scan history for the candidate |

**Private methods:**

| Method | Purpose |
|--------|---------|
| `processInBackground(scanId, cvId, candidateId, actor)` | The main 8-step async pipeline (see Section 9) |
| `evaluateOneJob(cvId, jobId, actor)` | Calls `matchingService.calculateForCvAndJob()` and extracts strengths/gaps/confidence |
| `extractStrengths(snapshot)` | Reads `snapshot.strengths[]`, returns top 4 strings |
| `extractGaps(snapshot)` | Reads `snapshot.gaps[]`, returns top 3 strings |
| `extractConfidenceScore(snapshot)` | Calculates confidence from requirement evaluations |
| `createCompletionNotification(candidateId, totalJobs, resultCount)` | Creates success notification |
| `createFailureNotification(candidateId)` | Creates failure notification |
| `getCandidateOrThrow(userId)` | Looks up candidate by userId or throws 404 |
| `toScanView(scan)` / `toResultView(result)` | Maps DB entities to API response types |
| `readJsonStringArray(value)` | Safely reads Json field as string array |

### 6.5 File: `apps/api/src/matching/recommendation.controller.ts`

**Purpose**: REST controller with 3 endpoints.

```typescript
@Controller('matching/recommend')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)      // 202
  startScan(@CurrentUser() user, @Body() dto: StartRecommendationDto)

  @Get()
  listScans(@CurrentUser() user, @Query('page') page?, @Query('limit') limit?)

  @Get(':scanId')
  getScanResult(@CurrentUser() user, @Param('scanId', ParseUUIDPipe) scanId)
}
```

### 6.6 File: `apps/api/src/matching/matching.module.ts` (Modified)

Added:
- **Imports**: `RecommendationService`, `RecommendationPrefilterService`, `RecommendationController`
- **controllers**: `RecommendationController` added
- **providers**: `RecommendationService`, `RecommendationPrefilterService` added
- **exports**: `RecommendationService` added

---

## 7. Frontend Implementation

### 7.1 File: `apps/web/lib/recommendation-client.ts`

**Purpose**: Typed API client functions for the frontend, mirroring the pattern from `applications-client.ts`.

**Exported types:**
- `MatchTier` — `'excellent' | 'good' | 'potential' | 'low'`
- `MATCH_TIER_CONFIG` — label, emoji, CSS color, CSS background for each tier
- `RecommendationResultItem` — single result with job details
- `RecommendationScanResponse` — full scan response
- `RecommendationScanListItem` — summary for history list
- `RecommendationScanListResponse` — paginated list

**Exported functions:**

```typescript
// Start a new scan → returns { scanId: string }
startRecommendationScan(token: string, cvId: string)

// Get full scan results
getRecommendationScan(token: string, scanId: string)

// List scan history (paginated)
listRecommendationScans(token: string, page?: number)
```

### 7.2 File: `apps/web/app/dashboard/candidate/recommendations/page.tsx`

**Type**: Server Component (async)

**What it does:**
1. Auth check → redirects if not logged in or not CANDIDATE
2. Reads `searchParams.scanId` from URL (if coming back from scan start)
3. Fetches CVs and scan history in parallel using `Promise.all`
4. Renders:
   - **Start New Analysis section** — either "Upload CV first" prompt, or the `RecommendationStartForm`
   - **Active scan results** — `ScanResultsSection` if `scanId` is in URL
   - **Analysis History** — list of previous scans with status badges
   - **Back to Dashboard** link

**Sub-component: `ScanHistoryCard`**
- Renders a clickable card for each previous scan
- Shows: status badge (Processing/Completed/Failed), top score, result count, total jobs, processing time, date

### 7.3 File: `apps/web/app/dashboard/candidate/recommendations/recommendation-start-form.tsx`

**Type**: Client Component (`'use client'`)

**Props**: `cvs: CvItem[]`, `accessToken: string`

**Behavior:**
1. Auto-selects the primary CV (or first CV if none is primary)
2. User selects CV from dropdown → clicks "Start Analysis"
3. Calls `startRecommendationScan(accessToken, selectedCvId)`
4. On success: redirects to same page with `?scanId=<id>` + triggers router refresh
5. On error: shows error message
6. Shows brief explanation: "This may take 30-60 seconds"

### 7.4 File: `apps/web/app/dashboard/candidate/recommendations/scan-results-section.tsx`

**Type**: Client Component (`'use client'`)

**Props**: `scanId: string`, `accessToken: string`

**Behavior (state machine):**

| State | What renders |
|-------|-------------|
| **Loading** (no data yet) | Pulsing "Loading results..." |
| **PROCESSING** | Animated blue dot + progress info: "Comparing with N jobs...", "Filtered N potential jobs", "AI evaluated N/N" |
| **FAILED** | Red error border + error message |
| **COMPLETED** | Summary bar (N jobs evaluated from M total · Xs) + ranked `RecommendationCard` list |

**Polling logic:**
- Uses `useEffect` + `setTimeout` loop
- Polls `GET /matching/recommend/:scanId` every 3 seconds while `status === 'PROCESSING'`
- Stops polling on `COMPLETED` or `FAILED`
- Cleans up timer on unmount

**Sub-component: `RecommendationCard`**
- Tier-colored background (emerald/amber/orange/red)
- Left side: `#rank`, job title (link), company name, employment type badge, salary badge
- Right side: match score %, tier label with emoji, confidence indicator
- Bottom: strengths list + gaps list
- Action: "View Details →" link to `/jobs/:slug`

### 7.5 File: `apps/web/app/dashboard/candidate/page.tsx` (Modified)

Added a button in the action bar:

```tsx
<Button asChild>
  <Link href="/dashboard/candidate/recommendations">🔍 Smart Job Match</Link>
</Button>
```

---

## 8. API Reference

### POST `/api/matching/recommend`

Start a new recommendation scan.

**Auth**: Bearer JWT (role: CANDIDATE)

**Request body:**
```json
{
  "cvId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**: `202 Accepted`
```json
{
  "scanId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Error responses:**
| Status | Condition |
|--------|-----------|
| 400 | `cvId` is not a valid UUID |
| 401 | Not authenticated |
| 403 | User role is not CANDIDATE |
| 404 | CV not found or doesn't belong to this candidate |

---

### GET `/api/matching/recommend`

List scan history for the current candidate.

**Auth**: Bearer JWT (role: CANDIDATE)

**Query params:**
- `page` (optional, default: 1)
- `limit` (optional, default: 5)

**Response**: `200 OK`
```json
{
  "items": [
    {
      "id": "scan-uuid",
      "status": "COMPLETED",
      "totalJobs": 50,
      "aiEvaluated": 18,
      "processingMs": 45000,
      "createdAt": "2026-03-16T12:00:00.000Z",
      "completedAt": "2026-03-16T12:00:45.000Z",
      "resultCount": 10,
      "topScore": 85.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "totalItems": 3,
    "totalPages": 1
  }
}
```

---

### GET `/api/matching/recommend/:scanId`

Get full scan details with ranked results.

**Auth**: Bearer JWT (role: CANDIDATE)

**Response**: `200 OK`
```json
{
  "id": "scan-uuid",
  "status": "COMPLETED",
  "totalJobs": 50,
  "preFiltered": 20,
  "aiEvaluated": 18,
  "processingMs": 45000,
  "errorMessage": null,
  "createdAt": "2026-03-16T12:00:00.000Z",
  "completedAt": "2026-03-16T12:00:45.000Z",
  "results": [
    {
      "id": "result-uuid",
      "rank": 1,
      "matchScore": 85.5,
      "matchTier": "excellent",
      "confidenceScore": 0.82,
      "strengths": [
        "Strong React experience with 3+ years",
        "TypeScript proficiency demonstrated across multiple projects",
        "Bachelor's degree in Computer Science aligns with requirement"
      ],
      "gaps": [
        "No AWS experience mentioned in CV",
        "Leadership experience not evident"
      ],
      "job": {
        "id": "job-uuid",
        "title": "Senior Frontend Developer",
        "slug": "senior-frontend-developer-abc123",
        "employmentType": "FULL_TIME",
        "salaryMin": 15000000,
        "salaryMax": 25000000,
        "company": {
          "name": "TechCorp Vietnam",
          "logoUrl": null
        }
      }
    }
  ]
}
```

---

## 9. Async Processing Pipeline

### 8-Step Background Process

The `processInBackground()` method runs these steps sequentially:

```
Step 1: Fetch CV data
  ├── Read cv.skills, cv.skillAtoms, cv.rawText
  └── Parse skillAtoms → extract canonical skill set

Step 2: Fetch all published jobs
  └── SELECT * FROM Job WHERE status='PUBLISHED' AND deletedAt IS NULL

Step 3: Pre-filter
  ├── Compute Jaccard similarity for each job vs CV canonical skills
  ├── If CV has <5 skills: also compute text keyword overlap
  ├── Sort by combined score
  └── Take top 20

Step 4: AI Evaluate in sequential batches of 2
  ├── Batch 1: jobs[0], jobs[1] → Promise.allSettled()
  ├── Batch 2: jobs[2], jobs[3] → Promise.allSettled()
  ├── ... (sequential, NOT parallel across batches)
  ├── Each: calls MatchingService.calculateForCvAndJob()
  ├── Extract: matchScore, matchingVersion, matchingSnapshot
  └── Failed evaluations are logged and skipped (don't fail the scan)

Step 5: Sort and take top 10
  └── Sort evaluations by matchScore desc → slice(0, 10) → assign ranks 1-10

Step 6: Save results
  └── prisma.recommendationResult.createMany(rankedResults)

Step 7: Update scan status
  └── UPDATE RecommendationScan SET status=COMPLETED, totalJobs, preFiltered,
      aiEvaluated, processingMs, completedAt

Step 8: Create notification
  └── INSERT INTO Notification (userId, title, body)
```

### Error Handling

If ANY unhandled error occurs during steps 1-8:
1. Log error with `AppLogger.error()`
2. **Best-effort** update scan to `FAILED` status with error message
3. **Best-effort** create failure notification
4. Both best-effort operations use `.catch(() => {})` to never throw

The top-level `processInBackground().catch()` in `startScan()` also catches completely unhandled errors.

### Fire-and-Forget Pattern

```typescript
// In startScan():
this.processInBackground(scan.id, cvId, candidate.id, actor).catch(
  (error) => {
    this.logger.error('recommendation_scan_unhandled', { ... });
  },
);
return { scanId: scan.id };  // Returns immediately with 202
```

---

## 10. Notification System

Uses the existing `Notification` model (already in schema, already displayed in the app header).

### Success Notification

**When**: All processing steps complete without unhandled error.

```
Title: "Smart Job Match results are ready!"
Body:  "Analyzed {totalJobs} jobs and found {resultCount} best-matching positions. View results now!"
```

### Failure Notification

**When**: An error occurs during processing.

```
Title: "CV analysis failed"
Body:  "The system encountered an error while analyzing your CV. Please try again later."
```

---

## 11. Constraints & Rate Limits

### Gemini API (Free Tier)

| Constraint | Value | How We Handle |
|------------|-------|---------------|
| Rate limit | ~15 RPM | Sequential batches of 2 (`AI_BATCH_SIZE = 2`) |
| Token limit per request | ~1M | Each call is single CV vs single JD (well within limit) |
| Daily quota | ~1500 requests | Pre-filter limits to 20 AI calls per scan |

### Performance Characteristics

| Metric | Expected Value |
|--------|----------------|
| Pre-filter time | < 100ms (in-memory, no API calls) |
| Per-job AI evaluation | ~2-4 seconds |
| Total for 20 jobs (10 batches × 2) | ~30-60 seconds |
| DB writes | ~5ms |
| Notification creation | ~2ms |

### Batch Strategy: Why 2, Not 5?

With Gemini Free tier's ~15 RPM limit:
- Batch of 2 = safe, never hits rate limit
- Batch of 5 = would hit 15 RPM quickly if batches run fast
- Sequential batches (not parallel) ensure we never exceed the limit

---

## 12. Rollback Strategy

### Level 1: Git — Before Migration (Safest)

```bash
cd d:\Education\EXE101\JobMatchingMVP

# Create feature branch with ALL new code
git checkout -b feature/multi-jd-matching
git add -A
git commit -m "feat(matching): add multi-jd recommendation feature"

# Return to safe demo code
git checkout main
```

**To resume feature work**: `git checkout feature/multi-jd-matching`  
**To demo safely**: `git checkout main`

### Level 2: DB — After Migration Has Run

```sql
-- Drop the new tables (DOES NOT affect any existing tables)
DROP TABLE IF EXISTS "RecommendationResult" CASCADE;
DROP TABLE IF EXISTS "RecommendationScan" CASCADE;
DROP TYPE IF EXISTS "RecommendationScanStatus" CASCADE;

-- Remove migration record so Prisma doesn't think it's applied
DELETE FROM "_prisma_migrations"
WHERE migration_name LIKE '%add_recommendation_scan%';
```

Then restore the old schema and regenerate client:
```bash
git checkout main -- apps/api/prisma/schema.prisma
cd apps/api && npx prisma generate
```

### Level 3: Full Reset

```bash
git checkout main
git checkout -- .
git clean -fd
cd apps/api && npx prisma generate
```

### Why Rollback is Safe

The migration SQL only contains:
1. `CREATE TYPE "RecommendationScanStatus"` — new enum
2. `CREATE TABLE "RecommendationScan"` — new table
3. `CREATE TABLE "RecommendationResult"` — new table
4. `CREATE INDEX` statements — new indexes
5. `ALTER TABLE ... ADD FOREIGN KEY` — foreign keys on **new** tables only

**No existing tables are altered.** The `ALTER TABLE "Candidate"` and `ALTER TABLE "Job"` only add foreign key constraints FROM the new tables TO the existing ones, which Prisma handles automatically via the relation definitions.

---

## 13. Testing Guide

### Prerequisites

1. Docker Desktop running (PostgreSQL on port 5433)
2. Migration applied: `npx prisma migrate dev --name add-recommendation-scan`
3. Backend + frontend running: `.\run-dev.ps1`
4. A candidate account with at least one uploaded CV
5. At least some published jobs in the system

### Step-by-Step UI Test

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as a candidate | Dashboard with stats |
| 2 | Click "🔍 Smart Job Match" | Navigate to `/dashboard/candidate/recommendations` |
| 3 | See "Start New Analysis" section | CV dropdown auto-selects primary CV |
| 4 | Click "Start Analysis" | Button shows "⏳ Submitting..." |
| 5 | Page redirects | URL becomes `?scanId=<uuid>`, "Analyzing..." section appears |
| 6 | Wait 30-60 seconds | Progress updates: "Comparing with N jobs", "Filtered N potential jobs", "AI evaluated M/N" |
| 7 | Scan completes | Results section shows ranked job cards with scores, tiers, strengths, gaps |
| 8 | Check notification bell | Should show "Smart Job Match results are ready!" |
| 9 | Click "View Details →" on a result | Navigates to the job detail page |
| 10 | Go back to recommendations page | History section shows the completed scan with top score |

### API Test with curl

```bash
# 1. Start a scan
curl -X POST http://localhost:3001/api/matching/recommend \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"cvId": "<CV_UUID>"}'
# Expected: 202 { "scanId": "..." }

# 2. Poll for status
curl http://localhost:3001/api/matching/recommend/<SCAN_ID> \
  -H "Authorization: Bearer <JWT_TOKEN>"
# Expected: 200 with status PROCESSING → eventually COMPLETED

# 3. List history
curl http://localhost:3001/api/matching/recommend?page=1&limit=5 \
  -H "Authorization: Bearer <JWT_TOKEN>"
# Expected: 200 with items array
```

---

## 14. Future Improvements

### Priority 1 (Next iteration)
- [ ] **Domain/category overlap** — compare CV domain skills to `Job.category` for better pre-filter
- [ ] **Experience level matching** — compare CV total experience months to JD minimum requirements
- [ ] **Progress SSE/WebSocket** — real-time progress updates instead of 3s polling

### Priority 2 (Nice-to-have)
- [ ] **Retry low-confidence results** — re-evaluate top 5 with an enhanced prompt if confidence < 0.4
- [ ] **Job deduplication** — group similar JDs from the same company
- [ ] **Cache results** — if no new jobs published since last scan, skip re-evaluation
- [ ] **Scan cooldown** — prevent candidates from running scans too frequently (e.g., max 1 per hour)

### Priority 3 (Scale)
- [ ] **Queue-based processing** — move to Bull/BullMQ queue for horizontal scaling
- [ ] **Incremental evaluation** — only evaluate NEW jobs since last scan
- [ ] **Embedding pre-filter** — add vector similarity as an additional pre-filter signal

---

## Appendix: Complete File Listing

### New Files (10)

| # | File Path | Lines | Purpose |
|---|-----------|-------|---------|
| 1 | `apps/api/src/matching/recommendation.types.ts` | 60 | Types, MatchTier enum, resolveMatchTier utility |
| 2 | `apps/api/src/matching/dto/start-recommendation.dto.ts` | 6 | Request validation DTO |
| 3 | `apps/api/src/matching/services/recommendation-prefilter.service.ts` | 105 | Jaccard pre-filter + text keyword fallback |
| 4 | `apps/api/src/matching/services/recommendation.service.ts` | 558 | Core orchestration service |
| 5 | `apps/api/src/matching/recommendation.controller.ts` | 57 | REST controller (3 endpoints) |
| 6 | `apps/web/lib/recommendation-client.ts` | 144 | Frontend API client + tier config |
| 7 | `apps/web/app/dashboard/candidate/recommendations/page.tsx` | 149 | Server component page |
| 8 | `apps/web/app/dashboard/candidate/recommendations/recommendation-start-form.tsx` | 94 | Client component: CV selector + start button |
| 9 | `apps/web/app/dashboard/candidate/recommendations/scan-results-section.tsx` | 262 | Client component: polling + results display |
| 10 | `apps/api/prisma/migrations/*/migration.sql` | auto | Database migration |

### Modified Files (3)

| # | File Path | What Changed |
|---|-----------|-------------|
| 1 | `apps/api/prisma/schema.prisma` | Added `RecommendationScanStatus` enum, `RecommendationScan` model, `RecommendationResult` model, relations on `Candidate` and `Job` |
| 2 | `apps/api/src/matching/matching.module.ts` | Added `RecommendationController`, `RecommendationService`, `RecommendationPrefilterService` to module |
| 3 | `apps/web/app/dashboard/candidate/page.tsx` | Added "🔍 Smart Job Match" button in action bar |
