# Matching Algorithm

## Tổng Quan

Tính điểm phù hợp (0-100%) giữa CV và Job Description.

**Công thức:**

```
Final Score = (TF-IDF Score × 0.7) + (Skills Score × 0.3)
```

## Canonical Skill Atoms (Foundation)

### Overview
Skill atoms are **deterministic, normalized representations** of individual skills extracted from CV/Job during parsing. Each atoms includes:
- `raw` - Original text from CV/Job
- `label` - Normalized display name
- `canonical` - Unique canonical identifier (e.g., 'python', 'django')
- `group` - Category (PROGRAMMING, FRAMEWORK, DATABASE, TOOL, SOFT_SKILL)
- `source` - Origin: `cv_parsed`, `cv_manual`, `job_parsed`, or `job_manual`

### Deterministic Atomization
All CVs and Jobs store **dual skill representations**:
- `skills` (Json) - Display values for UI
- `skillAtoms` (Json) - Canonical atoms for matching logic

This ensures matching is deterministic and not affected by skill string variations (e.g., "Python", "python", "PYTHON" all canonicalize to `canonical: 'python'`).

### Canonical Requirement
Matching v2 reads `skillAtoms` only. If canonical atoms are missing, matching emits warnings and the affected record should be reprocessed before recruiters rely on the score.

## Version Routing

Matching algorithm respects `MATCHING_VERSION` environment variable:
- `MATCHING_VERSION=legacy` - Uses legacy string comparison (deprecated)
- `MATCHING_VERSION=v2` (default) - Uses canonical skill atoms for deterministic matching

## Phase 1: TF-IDF + Skills (MVP)

### 1. TF-IDF Score

**Input:**

- CV text (full text từ parsed CV)
- JD text (job description + requirements)

**Process:**

```typescript
import natural from 'natural';

function calculateTFIDF(cvText: string, jdText: string): number {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  // Add documents
  tfidf.addDocument(cvText);
  tfidf.addDocument(jdText);

  // Calculate cosine similarity
  const cvVector = tfidf.listTerms(0);
  const jdVector = tfidf.listTerms(1);

  const similarity = cosineSimilarity(cvVector, jdVector);
  return similarity; // 0.0 - 1.0
}
```

**Output:** Score từ 0.0 đến 1.0

### 2. Skills Score (v2: Canonical Matching)

**Input (v2):**

- CV skillAtoms: `[{canonical: 'python'}, {canonical: 'django'}, {canonical: 'postgresql'}, {canonical: 'docker'}]`
- Job skillAtoms: `[{canonical: 'python'}, {canonical: 'django'}, {canonical: 'postgresql'}, {canonical: 'kubernetes'}]`

**Process:**

```typescript
function calculateSkillsScore(cvAtoms: SkillAtom[], jobAtoms: SkillAtom[]): number {
  const cvSet = new Set(cvAtoms.map((a) => a.canonical));
  const jobSet = new Set(jobAtoms.map((a) => a.canonical));

  let matchCount = 0;
  for (const canonical of jobSet) {
    if (cvSet.has(canonical)) {
      matchCount++;
    }
  }

  return matchCount / jobSet.size; // 0.0 - 1.0
}
```

**Example:**

- Match: 3/4 = 0.75 (75%)
- Matched (canonical): `python`, `django`, `postgresql`
- Missing (canonical): `kubernetes`

### 3. Final Score

```typescript
function calculateMatchScore(cvId: string, jobId: string) {
  const cv = await getCVData(cvId);
  const job = await getJobData(jobId);

  // 1. TF-IDF
  const cvText = extractCVText(cv);
  const jdText = extractJDText(job);
  const tfidfScore = calculateTFIDF(cvText, jdText);

  // 2. Skills
  const skillsScore = calculateSkillsScore(cv.skills, job.skills);

  // 3. Weighted combination
  const finalScore = tfidfScore * 0.7 + skillsScore * 0.3;

  return {
    score: Math.round(finalScore * 100), // 0-100
    tfidfScore,
    skillsScore,
    breakdown: {
      matchedSkills: getMatchedSkills(cv.skills, job.skills),
      missingSkills: getMissingSkills(cv.skills, job.skills),
    },
  };
}
```

## Phase 2: Semantic Embeddings (Bonus)

Nếu còn thời gian, thêm Gemini embeddings:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

async function calculateSemanticScore(cvText: string, jdText: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'text-embedding-004',
  });

  // Generate embeddings
  const cvResult = await model.embedContent(cvText);
  const jdResult = await model.embedContent(jdText);

  // Cosine similarity
  const score = cosineSimilarity(
    cvResult.embedding.values,
    jdResult.embedding.values,
  );

  return score; // 0.0 - 1.0
}

// Updated final score
const finalScore = tfidfScore * 0.4 + skillsScore * 0.2 + semanticScore * 0.4;
```

## Matching Snapshot

Each application stores a **matching snapshot** (JSON) capturing the matching state at application time:

```typescript
interface MatchingSnapshot {
  version: 'legacy' | 'v2';        // Routing version used
  componentScores: {
    tfidf: number;                 // 0.0 - 1.0
    skills: number;                // 0.0 - 1.0
    final: number;                 // 0-100 percent
  };
  topMatchedSkills: string[];       // Top 8 matched canonical names
  missingSkills: string[];          // Missing canonical names
  warnings: string[];               // Parse quality warnings
}
```

This allows recruiter UI to:
- Display rich matching breakdown
- Track matching determinism (same snapshot on re-evaluate = bug-free)
- Detect parsing quality issues or missing canonical skill data

## UI Display

### Match Score Card

```
┌─────────────────────────────────────┐
│ Nguyễn Văn A                        │
│ Match Score: 78% ⭐⭐⭐⭐           │
│                                     │
│ Skills Match: 3/4 (75%)             │
│ ✓ Python, Django, PostgreSQL        │
│ ✗ Kubernetes                        │
│                                     │
│ Text Similarity: 72%                │
└─────────────────────────────────────┘
```

### Ranking

```
Top Candidates:

1. 🥇 Nguyễn Văn A    - 78%
2. 🥈 Trần Thị B      - 72%
3. 🥉 Lê Văn C        - 68%
4.    Phạm Thị D      - 55%
```

## Performance

- **TF-IDF:** ~50ms per match
- **Skills:** <10ms per match
- **Total:** ~60ms per match
- **Batch 100 CVs:** ~6 seconds

## Accuracy

- **TF-IDF only:** 60-70%
- **TF-IDF + Skills:** 70-80%
- **With Embeddings:** 80-90%
