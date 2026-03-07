# Matching Algorithm

## Tổng Quan

Tính điểm phù hợp (0-100%) giữa CV và Job Description.

**Phương pháp hiện tại (schema_v1):** Đánh giá CV so với structured requirements schema được extract từ JD, không dựa trên text similarity mà dựa trên requirement-level satisfaction từ candidate profile evidence.

## Schema-Based Matching Pipeline (v1)

### Architecture

```
JD Upload/Edit
  ↓
Extract RequirementsSchema v1
  ├─ role title, summary
  ├─ must-have requirements
  ├─ nice-to-have requirements
  ├─ experience/education/language constraints
  └─ location preferences
  ↓
Persist on Job

CV Upload/Edit
  ↓
Extract CandidateProfile v1
  ├─ headline, target role
  ├─ experience entries (with dates, tech, evidence)
  ├─ education entries
  ├─ skills (explicit evidence)
  ├─ languages, certifications
  └─ location/work-mode hints
  ↓
Persist on CV

Application Create
  ↓
RequirementsEvaluator
  ├─ Evaluate each must-have requirement against candidate profile
  ├─ Evaluate nice-to-have requirements
  ├─ Evaluate experience, education, language fit
  ├─ Evaluate location preference match
  └─ Produce requirement-level status: met|partial|missing|not_applicable
  ↓
DeterministicScorer
  ├─ Weight must-haves, nice-to-haves, experience, education, location, languages
  ├─ Apply explicit numeric weights (no ML/LLM)
  └─ Generate final matchScore (0-100)
  ↓
MatchingSnapshot v1 persisted on Application
```

### RequirementsSchema v1 Shape

```json
{
  "version": "requirements_schema_v1",
  "roleTitle": "Senior Backend Engineer",
  "summary": "Looking for experienced Node.js and TypeScript developer with PostgreSQL expertise",
  "mustHaves": [
    {
      "id": "req-1",
      "label": "3+ years TypeScript/Node.js backend",
      "category": "experience",
      "importance": "must_have",
      "keywords": ["typescript", "node.js", "backend"],
      "minimumMonths": 36
    }
  ],
  "niceToHaves": [
    {
      "id": "req-2",
      "label": "PostgreSQL optimization experience",
      "category": "skill",
      "importance": "nice_to_have",
      "keywords": ["postgresql", "database", "sql"],
      "minimumMonths": null
    }
  ],
  "locationPreference": {
    "city": "San Francisco",
    "country": "USA",
    "remote": true
  },
  "warnings": []
}
```

### CandidateProfile v1 Shape

```json
{
  "version": "candidate_profile_v1",
  "headline": "Full-stack JavaScript Developer",
  "targetRole": "Backend Engineer",
  "experience": [
    {
      "role": "Senior Developer",
      "company": "Tech Corp",
      "startDate": "2021-01",
      "endDate": "2025-03",
      "tech": ["typescript", "node.js", "postgresql", "react"]
    }
  ],
  "education": [
    {
      "school": "State University",
      "degree": "BS",
      "field": "Computer Science",
      "startDate": "2016-09",
      "endDate": "2020-05"
    }
  ],
  "skills": ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
  "languages": ["English"],
  "location": { "city": "San Francisco", "country": "USA" },
  "workMode": "remote",
  "warnings": []
}
```

### MatchingSnapshot v1 Shape

```json
{
  "version": "schema_v1",
  "scoreBreakdown": {
    "mustHaves": 95,
    "niceToHaves": 80,
    "experience": 90,
    "education": 100,
    "location": 100,
    "final": 92
  },
  "requirements": [
    {
      "id": "req-1",
      "label": "3+ years TypeScript/Node.js backend",
      "category": "experience",
      "importance": "must_have",
      "status": "met",
      "evidence": ["Senior Developer at Tech Corp, 2021-2025 (4 years)"]
    }
  ],
  "strengths": [
    "Strong TypeScript and Node.js background",
    "Relevant PostgreSQL optimization experience"
  ],
  "gaps": [
    "No Kubernetes experience (nice-to-have)",
    "Located in PST (job flexible on timezone)"
  ],
  "warnings": []
}
```

### Deterministic Evaluation Rules

**Scoring weights (configurable):**
- Must-have requirements met: 50%
- Nice-to-have requirements met: 15%
- Experience fit (seniority, years): 20%
- Education match: 10%
- Location/language preference: 5%

**Must-have evaluation:**
- `met`: Evidence in candidate profile matches requirement keywords and duration
- `partial`: Some keywords present but missing duration/depth
- `missing`: No matching evidence found
- `not_applicable`: Evaluator determined requirement doesn't apply to this candidate

**Nice-to-have evaluation:**
- Same statuses, but missing = 0 points (not penalized)

**Experience evaluation:**
- Candidate years in similar role ÷ Required minimum years
- Capped at 100%

**Final score:**
- Weighted sum of component scores (0-100)
- Rounded to nearest integer

## Version Routing

Matching algorithm respects `MATCHING_VERSION` environment variable and Job/CV schema versions:
- `matchingVersion: 'schema_v1'` → Uses schema-based evaluation (current)
- Fallback for legacy data → Emits warnings, requires backfill

## Legacy Approach (Removed)

The previous TF-IDF + exact skill matching runtime has been removed from the active application flow. The system now scores through schema evaluation only.

## Key Differences from Previous Approach

| Aspect | Removed runtime | Current (Schema v1) |
|--------|--------------------------|---------------------|
| Scoring input | Text similarity + keyword match | Structured requirement evaluation |
| Determinism | Text variation affects results | No text variation impact |
| Transparency | Opaque component scores | Requirement-level breakdown visible |
| Recruiter control | Scores only (no schema) | Recruiter defines schema upfront |
| Candidate experience | Skills display on CV | Profile evidence structured for evaluation |
| Matching algorithm | Statistical (word frequency) | Rule-based (requirement satisfaction) |

## Backend Services

- `JobRequirementsSchemaService` - Extracts and manages requirements schema for jobs
- `CandidateProfileService` - Extracts and manages candidate profile for CVs
- `SchemaMatchingEvaluatorService` - Evaluates candidate against requirements deterministically
- `MatchingService` - Main orchestrator, handles routing, version support
2. 🥈 Trần Thị B      - 72%
3. 🥉 Lê Văn C        - 68%
4.    Phạm Thị D      - 55%
```

## Performance

- **Schema evaluation:** low-millisecond CPU work after normalization data is available
- **Total per match:** dominated by persistence and normalization quality, not text-similarity math
- **Batch throughput:** scales linearly with number of evaluated applications

## Accuracy

- **Schema evaluation:** better recruiter-facing explainability and more stable requirement-level judgments
- **Operational goal:** consistency and auditability over opaque similarity scores
