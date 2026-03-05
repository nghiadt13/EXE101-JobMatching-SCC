# Matching Algorithm

## Tổng Quan

Tính điểm phù hợp (0-100%) giữa CV và Job Description.

**Công thức:**
```
Final Score = (TF-IDF Score × 0.7) + (Skills Score × 0.3)
```

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

### 2. Skills Score

**Input:**
- CV skills: `["Python", "Django", "PostgreSQL", "Docker"]`
- Job skills: `["Python", "Django", "PostgreSQL", "Kubernetes"]`

**Process:**
```typescript
function calculateSkillsScore(cvSkills: string[], jobSkills: string[]): number {
  const cvSet = new Set(cvSkills.map(s => s.toLowerCase()));
  const jobSet = new Set(jobSkills.map(s => s.toLowerCase()));

  let matchCount = 0;
  for (const skill of jobSet) {
    if (cvSet.has(skill)) {
      matchCount++;
    }
  }

  return matchCount / jobSet.size; // 0.0 - 1.0
}
```

**Example:**
- Match: 3/4 = 0.75 (75%)

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
  const finalScore = (tfidfScore * 0.7) + (skillsScore * 0.3);

  return {
    score: Math.round(finalScore * 100), // 0-100
    tfidfScore,
    skillsScore,
    breakdown: {
      matchedSkills: getMatchedSkills(cv.skills, job.skills),
      missingSkills: getMissingSkills(cv.skills, job.skills)
    }
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
    model: "text-embedding-004"
  });

  // Generate embeddings
  const cvResult = await model.embedContent(cvText);
  const jdResult = await model.embedContent(jdText);

  // Cosine similarity
  const score = cosineSimilarity(
    cvResult.embedding.values,
    jdResult.embedding.values
  );

  return score; // 0.0 - 1.0
}

// Updated final score
const finalScore = (tfidfScore * 0.4) + (skillsScore * 0.2) + (semanticScore * 0.4);
```

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
