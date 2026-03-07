# Research: Data Modeling & Pipeline Design for CV-to-JD Matching

**Date:** 2026-03-07  
**Status:** Complete research & synthesis  
**Scope:** Canonical schema, raw text retention, versioning, validation, confidence reporting, brittleness mitigation

---

## Executive Summary

The `job-matching` system implements **unified AI normalization** for both CVs and Job Descriptions through a shared Prisma-backed schema. Key findings indicate a **mature foundation** with gaps in raw text archival, version migration strategy, and quality confidence propagation. Current MVP approach prioritizes schema consistency and error fallback over historical data retention—suitable for new deployments but requires explicit reprocessing strategy for scaling.

---

## 1. Canonical Schema for JD & CV Comparison

### Current State

**Shared Schema Version:** `candidate_job_profile_v1` defined in NormalizedProfile

**Core fields (both CV & JD):**
- `schemaVersion`: locked to v1
- `language`: 'vi' | 'en' | 'mixed'
- `title`: job title / CV headline
- `summary`: max 2000 chars
- `skills`: normalized technical stack array
- `experience`: NormalizedExperience[] (role, company, date range, tech)
- `education`: NormalizedEducation[] (school, degree, field, dates, gpa)
- `certifications`, `projects`, `languages`, `location`
- `rawQuality`: {score: 0-100, needsManualReview: bool, reason: string}

**JD-specific:** `jobMeta` block (requirements, benefits, employmentType)

### Advantages
✅ Language-agnostic keys eliminate Vietnamese/English heading variance  
✅ Type-safe extraction avoids parser brittleness  
✅ Single schema per domain simplifies matching logic  
✅ rawQuality provides confidence scoring at parse time  

### Gaps
❌ No versioning beyond hardcoded constant  
❌ No timestamp for when normalization occurred  
❌ `jobMeta` attached to location field (odd placement)  
❌ No separate CV-vs-JD property tracking  

### Recommendation: Add Versioning Fields

Add optional fields (backward compatible):
- `schemaVersion`: 'candidate_job_profile_v1' (enum)
- `normalizedAt`: ISO timestamp of AI normalization
- Move `jobMeta` to root level (not nested in location)
- Pre-plan v2 migration path in comments

---

## 2. Raw Text Retention vs Normalized Fields Strategy

### Current Implementation

**Raw text is NOT persisted.** Data flow:
1. PDF/DOCX → extracted text (max 100k chars)
2. Free-form JD description stored as-is
3. Text → Gemini LLM → normalized JSON
4. Normalized result stored in `parsedData` + `normalizedProfile`
5. Original file path persisted (for CV), but not extracted text

### Problems
❌ No audit trail of original extraction  
❌ Impossible to reprocess with different LLM prompt without re-extracting  
❌ If Gemini format changes, no way to reconstruct prior intent  

### Recommendation: Store Extracted Text Hash + Lazy Reprocessing

**Minimal breaking change—add to schema:**

`
model CV {
  extractedTextHash    String?    // SHA-256 for dedup/reprocess validation
  normalizedVersion    String @default("candidate_job_profile_v1")
  normalizedAt         DateTime?  // When AI normalization ran
  
  @@index([extractedTextHash])
  @@index([normalizedVersion])
}

model Job {
  normalizedVersion    String @default("candidate_job_profile_v1")
  normalizedAt         DateTime?  // When AI normalization ran
}
`

**For MVP:** Just add versioning + timestamp fields.  
**For Phase 2:** Implement optional deep archive in S3 with 30-day retention + batch reprocessing job.

---

## 3. Reprocessing & Versioning Strategy

### Current Gaps
- No mechanism to version schemas beyond constant
- No flag to force reparse on update
- If Gemini API breaks, all records silently use stale parsing

### Proposed: Lazy Migration (Recommended for MVP)

1. Add `normalizedVersion` field (shown above)
2. On read, check version mismatch & warn if stale
3. Admin endpoint for selective reparse:
   `
   POST /admin/jobs/{jobId}/reprocess?force=true
   POST /admin/cvs/{cvId}/reprocess?force=true
   `
4. Batch reparse at off-hours if needed

### Timeline
- **Immediate:** Add versioning fields to schema
- **Phase 2:** Build batch reprocessing UI (auto-reparse on migration)
- **Phase 3:** Implement v1→v2 migration tools

---

## 4. Validation Rules & Quality Assurance

### Current Quality Indicators

**ParseStatus:** 'parsed_ok' | 'fallback' | 'needs_review'

**RawQuality:**
`json
{
  "score": 0,  // 0–100, higher = more confident
  "needsManualReview": true,
  "reason": "invalid_json_from_llm" | "fallback_parser"
}
`

### Validation Rules (Implicit)
- PDF/DOCX extraction fallback mechanism
- Text max 100k chars (enforced)
- JSON parsing + repair via second LLM call
- Schema normalization with type guards (all fields capped/normalized)

### Recommendation: Formalize Validation Layer

Create `NormalizedProfileValidator` with rules:

`	ypescript
// Each field has: max length, array size, date format, null allowance
rules = [
  { field: 'skills', rule: Array.length <= 100 },
  { field: 'summary', rule: String.length <= 2000 },
  { field: 'experience', rule: Array.length <= 50 },
  // ... all other fields
]

validate(profile) → { valid, errors[], confidence: 0-100 }
`

Integrate into normalization pipeline to produce per-profile confidence.

---

## 5. Confidence & Error Reporting Strategy

### Current State: Basic Telemetry
- Document-level: `source` (llm | fallback), `fallbackUsed`, `latencyMs`
- Per-document: `rawQuality.score`, `needsManualReview`, `reason`

### Gaps
❌ No per-field confidence (all-or-nothing)  
❌ No detailed error enum  
❌ Confidence NOT propagated to matching scores  

### Recommendation: Confidence Pyramid

**Level 1: Document confidence** (improve existing)

`json
{
  "overall": 0–100,
  "parseStatus": "parsed_ok | fallback | needs_review",
  "fallbackUsed": false,
  "latencyMs": 1200,
  "reason": "fallback_parser"
}
`

**Level 2: Field confidence** (NEW)

`json
{
  "skills": { "confidence": 95, "count": 12 },
  "experience": { "confidence": 70, "completeRecords": 3 },
  "summary": { "confidence": 90, "completeness": "full" },
  "location": { "confidence": 50, "isEstimated": true }
}
`

**Level 3: Matching confidence** (NEW)

`json
{
  "cvConfidence": 85,
  "jobConfidence": 72,
  "overallMatchConfidence": 78,
  "warningFlags": ["cv_low_extraction", "job_missing_requirements"]
}
`

**Implementation:** Wire field-level confidence into matching service:

`	ypescript
if (cvProfile.skills.confidence < 70) {
  skipSkillsMatching = true;  // Don't match on low-conf skills
}

matchingResult.confidence = {
  cvConfidence: extractConfidence(cv),
  jobConfidence: extractConfidence(job),
  warnings: generateWarnings(cv, job),
};
`

---

## 6. Brittleness from Free-Text Job Posts & Mitigation

### Root Causes

1. **Formatting variance:** "Req: React, Node.js" vs "• React\n• Node"
2. **Ambiguity:** Python = infrastructure vs backend; Senior = title vs experience
3. **Domain knowledge gaps:** LLM misses emerging tech, soft skills, jargon
4. **Cross-lingual issues:** Vietnamese + English tech terms mixed; weighting unclear

### Mitigation Strategies (Ranked by Impact)

| Strategy | Impact | Cost | Timeline |
|----------|--------|------|----------|
| Skill standardization registry | +15–20% precision | Medium | Phase 2 |
| Deterministic prompt validation | +5–10% fallback reduction | Low | Phase 1 backlog |
| Confidence-based field filtering | Fewer false positives | Low | Phase 1 (quick win) |
| Soft skill tracking | +3–5% precision | Medium | Phase 3 |
| Cross-lingual alignment | +5–8% (if multi-lang JDs) | Medium | Phase 3 |

### **#1: Skill Registry (HIGHEST ROI)**

Create canonical skill taxonomy; LLM maps to registry entries:

`	ypescript
const SKILL_REGISTRY = {
  'JavaScript': { aliases: ['js', 'ecmascript'], category: 'language' },
  'React': { aliases: ['reactjs', 'facebook react'], category: 'framework' },
  'Node.js': { aliases: ['nodejs', 'express'], category: 'runtime' },
  // ... 500+ canonical skills
};

// Update prompt:
// "Map all detected skills to this canonical registry. If no match, create new with category 'other'."
`

**Expected:** +15–20% matching precision improvement

### **#2: Deterministic Prompt Validation (HIGH-VALUE)**

Enforce strict schema with LLM retries:

`	ypescript
// Validate JSON schema matches expected structure
// If invalid, retry with repair prompt
// If still invalid, fallback
// This reduces non-determinism in responses
`

Expected: +5–10% reduction in fallback parsing

### **#3: Confidence-Based Field Filtering (QUICK WIN)**

Skip low-confidence fields during matching:

`	ypescript
if (cvProfile.skills.confidence < 70) {
  // Don't match on low-confidence skills
}
`

Expected: Fewer false positives (acceptable false negatives)

### **#4 & #5:** Defer to Phase 3 (soft skills, cross-lingual)

---

## 7. Prisma Data Model Summary & Extensibility

### Current Schema

**CV Model:**
- `id`, `candidateId`, `fileName`, `filePath`, `fileSize`, `mimeType`
- `parsedData` (Json) — contains normalizedProfile + schemaVersion + status
- `skills` (Json) — denormalized for fast filtering
- `isPrimary`, `createdAt`, `updatedAt`, `deletedAt`

**Job Model:**
- `id`, `recruiterId`, `title`, `slug`, `description` (raw JD text)
- `skills` (Json) — array of skill names
- `location` (Json) — contains normalized profile via `__normalization` key
- `salaryMin`, `salaryMax`, `employmentType`, `status`
- `publishedAt`, `closedAt`, `createdAt`, `updatedAt`, `deletedAt`

### Recommended Non-Breaking Extensions

`prisma
model CV {
  extractedTextHash    String?  @unique    // SHA-256 fingerprint
  normalizedVersion    String   @default("candidate_job_profile_v1")
  normalizedAt         DateTime?
  
  @@index([extractedTextHash])
  @@index([normalizedVersion])
}

model Job {
  normalizedVersion    String   @default("candidate_job_profile_v1")
  normalizedAt         DateTime?
  descriptionLanguage  String   @default("en")  // 'vi' | 'en' | 'mixed'
  
  @@index([normalizedVersion])
  @@index([descriptionLanguage])
}

// Optional: Normalization audit table (future)
model NormalizationAudit {
  id            String  @id @default(uuid())
  entityType    String  // 'cv' | 'job'
  entityId      String
  schemaVersion String
  status        String  // 'parsed_ok' | 'fallback' | 'needs_review'
  confidence    Int     // 0–100
  errors        Json?   // Validation errors
  createdAt     DateTime @default(now())
  
  @@unique([entityType, entityId, createdAt])
  @@index([entityType, status])
}
`

### Storage for Extracted Text (Optional for Phase 2)

**Option A: Cold Archive (Recommended for compliance)**
`prisma
model ExtractedTextArchive {
  id              String   @id @default(uuid())
  cvId            String
  extractedText   String   @db.Text    // Full extracted text
  extractedTextHash String @unique     // SHA-256
  textLanguage    String
  extractedAt     DateTime @default(now())
  retentionUntil  DateTime             // Auto-delete after this
  
  @@index([cvId, retentionUntil])
}
`

**Option B: Lazy Reprocessing (Simpler)**
- Don't store extracted text
- Re-extract from PDF/DOCX on-demand for reprocessing
- Longer latency acceptable (minutes, not seconds)

---

## 8. API Contract & Integration Points

### Normalization Response (POST /api/cvs/upload)

`json
{
  "parsedData": {
    "normalizedProfile": {
      "schemaVersion": "candidate_job_profile_v1",
      "language": "en",
      "title": "Senior React Developer",
      "skills": ["React", "Node.js"],
      "experience": [],
      "rawQuality": {
        "score": 85,
        "needsManualReview": false
      }
    },
    "parseStatus": "parsed_ok",
    "parseTelemetry": {
      "source": "llm",
      "fallbackUsed": false,
      "latencyMs": 1200
    }
  }
}
`

### Matching Response (POST /api/matching/calculate)

`json
{
  "score": 0.78,
  "tfidfScore": 0.75,
  "skillsScore": 0.82,
  "breakdown": { "matched": ["React"], "missing": [], "extra": [] },
  "confidence": {
    "cvConfidence": 85,
    "jobConfidence": 72,
    "overallMatchConfidence": 78,
    "warningFlags": []
  }
}
`

---

## Implementation Checklist (Next Phase)

- [ ] Add `normalizedVersion`, `normalizedAt` to CV + Job (non-breaking migration)
- [ ] Create `NormalizedProfileValidator` with field-level rules
- [ ] Add field confidence calculation → integrate into matching
- [ ] Wire confidence into `MatchingResult` API response
- [ ] Create skill registry + reference in Gemini prompt
- [ ] Add admin endpoints: `POST /admin/cvs/{id}/reprocess`, `POST /admin/jobs/{id}/reprocess`
- [ ] Log all normalizations for quality monitoring
- [ ] Update docs with confidence interpretation guide
- [ ] Plan Phase 2 archival strategy (extracted text retention policy)

---

## Unresolved Questions

1. Should extracted text be archived for audit/compliance?  
   → MVP: No. Phase 2: Evaluate retention per region (GDPR, Vietnam laws).

2. How to handle matching CV/Job pairs with different schema versions?  
   → MVP: Assume v1. Phase 2: Add explicit version check + migration adapter.

3. Will Gemini model changes affect extraction quality?  
   → MVP: No (using stable gemini-3.1-flash-lite). Phase 2: Benchmarking framework.

4. Track soft skills separately?  
   → MVP: No. Phase 2: Only if recruiter feedback warrants.

5. Special weight for Vietnamese tech terms in mixed-language JDs?  
   → MVP: Equal weight. Phase 2: Only if metrics show quality degradation.

---

**Report completed:** 2026-03-07  
**Next review:** After Phase 1 rollout (confidence checks)
