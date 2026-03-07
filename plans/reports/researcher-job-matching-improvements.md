# Job Matching System: Practical Improvements Research Report

## Executive Summary

Current system uses TF-IDF (70%) + exact skills match (30%) with hardcoded skill dictionary and simple text normalization. Performance: 70-80% claimed accuracy, ~60ms per match. This report identifies 7 key improvement areas with low-complexity, high-ROI changes prioritized for MVP+ timeline.

---

## 1. PROFILE CANONICALIZATION

### Current State
- Text normalization: lowercase + regex strip special chars
- Skills: stored as JSON array, deduplicated in set
- No multi-variant handling (e.g., "node.js" vs "nodejs" vs "node" all treated separately)

### Recommendations

#### 1a. Two-Tier Canonicalization
Split normalization into **preservation** + **matching** layers:

**Preservation (DB storage)**
- Store original skill text (e.g., "Node.js") for UI display
- Add normalized form for internal matching: lowercase, trim, standardize separators ("—" → "-", ". " → "."), remove trailing versions ("Python 3.9" → "Python")
- Schema change: \skills: string[]\ → \skills: { original: string; canonical: string }[]\

**Matching (runtime)
- Use canonical form for overlap comparison: "Node.js" + "nodejs" + "node.js" all normalize to "nodejs"
- Fuzzy threshold: if canonical forms meet Jaro-Winkler ≥ 0.85, treat as match

#### 1b. Location Canonicalization
- Add simple geo alias: "HCM" → "Ho Chi Minh", "SG" → "Singapore"
- Store region + timezone for recruiter filtering logic later

**Why**: Prevents 10-15% match loss from style variants; stores original for recruiter confidence.

---

## 2. DICTIONARY & SYNONYM EXPANSION

### Current State
- 22-item hardcoded skill list in AiNormalizationService
- No synonym mapping
- LLM fallback when GEMINI_API_KEY missing

### Recommendations

#### 2a. Build Curated Synonym Mapping (No LLM Calls)

Create /data/skill-synonyms.json:

\\\json
{
  "python": ["python2", "python3", "py"],
  "nodejs": ["node.js", "node", "npm"],
  "react": ["reactjs"],
  "typescript": ["ts"],
  "sql": ["mysql", "postgresql", "sql server"],
  "kubernetes": ["k8s"],
  "docker": ["container", "containerization"]
}
\\\

Expand the 22-item dictionary to **50-70 entries** by adding:
- Common misspellings: "Postgre" → "PostgreSQL", "Expressjs" → "Express"
- Framework aliases: "Next" → "Next.js", "Vue" → "Vue.js"
- Platform synonyms: "AWS EC2" → "AWS", "Google Cloud" → "GCP"

**Implementation**:
- Load once at startup into Map<string, string[]>
- In calculateBreakdown(): expand CV skills → their synonyms, then check job overlap
- Cost: **~5ms** added per match (one-time lookup)

#### 2b. Tiered Skill Dictionary
Keep three tiers instead of one:

1. **Exact** (tier 0): Perfect match required → high confidence
2. **Family** (tier 1): Synonym/variant match → medium confidence  
3. **Fuzzy** (tier 2): Levenshtein ≥ 0.8 → low confidence

Score: exact = 1.0, family = 0.8, fuzzy = 0.5 (recruit must decide if 0.5 acceptable)

**Why**: Recruiter needs to see which matches are "sure" vs "detected" (builds trust in explainability).

---

## 3. WEIGHTED SKILL FAMILIES

### Current State
- All skills treated equally in overlap calc: 3/4 = 0.75
- No family grouping: "JavaScript" and "Node.js" both count as 1 skill

### Recommendations

#### 3a. Define Skill Taxonomy

Create /data/skill-families.json:

\\\json
{
  "Languages": {
    "weight": 1.0,
    "skills": ["javascript", "python", "java", "typescript", "c++"]
  },
  "Backend Frameworks": {
    "weight": 0.8,
    "skills": ["nestjs", "express", "django", "spring"]
  },
  "Databases": {
    "weight": 0.9,
    "skills": ["postgresql", "mongodb", "mysql"]
  },
  "DevOps": {
    "weight": 0.7,
    "skills": ["docker", "kubernetes", "aws", "ci/cd"]
  },
  "Frontend": {
    "weight": 0.6,
    "skills": ["react", "vue", "tailwind"]
  }
}
\\\

#### 3b. Weighted Overlap Formula

Replace:
`
score = matched / total_job_skills
`

With:
`
score = sum(family_weight for matched_skill)
        / sum(family_weight for all_job_skills)
`

Example:
- Job wants: Python (weight 1.0) + Docker (weight 0.7) + React (weight 0.6) = 2.3
- Candidate has: Python (1.0) + Docker (0.7) = 1.7
- Score: 1.7 / 2.3 = **74%** (vs naive 2/3 = 67%)

#### 3c. Family Coverage Bonus
Add secondary score: "what % of family categories does CV cover?"

If job needs Backend (3 frameworks) + DevOps (4 tools):
- Candidate has Backend (2/3) + no DevOps = **50% family coverage** → +0.05 bonus to skills score

**Why**: Weighting captures that Python + PostgreSQL = "backend ready" (both in core family), vs React alone = "incomplete" for backend role.

---

## 4. EXACT VS. FUZZY OVERLAP TRADEOFFS

### Current State
- Exact match only (set intersection)
- No fuzzy matching
- No threshold tuning per role type

### Recommendations

#### 4a. Implement Fuzzy Matching with Jaro-Winkler
Add to SkillsCalculatorService:

\\\	ypescript
private fuzzyMatch(cvSkill: string, jobSkill: string, threshold = 0.85): boolean {
  const distance = jaroWinklerDistance(cvSkill, jobSkill);
  return distance >= threshold;
}
\\\

Use library: uzzyset.js or js-string-similarity (both <10KB, no native deps).

#### 4b. Triple-Tier Matching Logic

`	ypescript
for (const jobSkill of jobSkills) {
  // Tier 1: Exact canonical match
  if (exactMatches.has(jobSkill)) {
    score += weight[jobSkill] * 1.0;
    continue;
  }
  
  // Tier 2: Synonym/family match
  if (familyMatches.has(jobSkill)) {
    score += weight[jobSkill] * 0.8;
    continue;
  }
  
  // Tier 3: Fuzzy (Jaro-Winkler >= 0.85)
  if (cvSkills.some(cv => jaroWinkler(cv, jobSkill) >= 0.85)) {
    score += weight[jobSkill] * 0.5;
    fuzzyMatches.push({ cvSkill, jobSkill, distance });
  }
}
`

#### 4c. Mode Selection (User-Tunable)

Add env var: MATCHING_MODE=strict|balanced|loose

- **Strict** (0.85 JW threshold): Use for senior roles, exact match preferred
- **Balanced** (0.80 JW threshold, enable family matching): Default
- **Loose** (0.75 JW threshold, all 3 tiers): For entry-level roles with limited terminology

Store selection in job record: \Job.matchingMode\

**Why**: Exact match causes false negatives ("React" vs "ReactJS"); fuzzy at 0.75 adds noise. 0.80-0.85 is production-ready bound.

---

## 5. RECRUITER-FACING EXPLAINABILITY

### Current State
- UI shows: Score % + matched/missing skills list
- No reasoning chain
- Recruiter cannot see match breakdown (TF-IDF vs skills weight)

### Recommendations

#### 5a. Match Reasoning JSON Schema

Extend MatchingResult to include:

\\\	ypescript
interface MatchExplanation {
  // Component scores with weights
  tfidfScore: number; // 0-100
  skillsScore: number; // 0-100
  finalScore: number; // 0-100
  
  // Skill-level detail
  skillsBreakdown: {
    exact: Array<{ skill: string; weight: number }>;     // Tier 1
    family: Array<{ skill: string; variant: string; weight: number }>; // Tier 2
    fuzzy: Array<{ cvSkill: string; jobSkill: string; distance: number; weight: number }>; // Tier 3
    missing: Array<{ skill: string; weight: number }>;
  };
  
  // Text matching detail (top 3 matching terms)
  topTerms: Array<{ term: string; cvFreq: number; jobFreq: number; idfScore: number }>;
  
  // Confidence + recommendations
  confidence: 'high' | 'medium' | 'low';
  recommendedAction: string; // "Strong fit" | "Review resume" | "Interview preferred"
}
\\\

#### 5b. UI Display Strategy

Show a **collapsible detail panel**:

`
┌──────────────────────────────────────┐
│ Anna Match Score: 84% ████████░      │
│                                       │
│ Components breakdown:                 │
│  TF-IDF (70%):     80  [██████████]   │
│  Skills (30%):     88  [██████████]   │
│                                       │
│ Skills Detail [▼ expand]              │
│  ✓ Exact (3): Python, TypeScript,... │
│  ◐ Variant (1): Postgre→PostgreSQL   │
│  ✗ Missing (1): Kubernetes           │
│                                       │
│ Top Matching Terms [▼ expand]        │
│  "backend" (both docs)               │
│  "API" (both)                        │
│                                       │
│ Confidence: HIGH ⭐                  │
│ Recommendation: "Strong fit, fast... │
└──────────────────────────────────────┘
`

#### 5c. Audit Trail Logging

Log every match calculation:

\\\	ypescript
interface MatchAuditLog {
  timestamp: ISO8601;  
  cvId: string;
  jobId: string;
  explanation: MatchExplanation;
  recruiterAction?: 'accepted' | 'rejected' | 'interview';
  notes?: string;
}
\\\

Store in DB table \MatchAuditLogs\. Enable recruiter to:
1. See why a candidate was (or wasn't) recommended
2. Provide feedback: "false positive" / "false negative" → used for model calibration later

**Why**: Transparency builds recruiter trust; creates ground truth for regression testing.

---

## 6. REGRESSION TESTING DATASETS

### Current State
- 5 hardcoded demo users (seed.ts)
- Deterministic scores in application records
- Single test file (matching.service.spec.ts) with ~5 test cases

### Recommendations

#### 6a. Build Regression Test Suite

Create /apps/api/test/fixtures/matching-regressions.json:

\\\json
{
  "testCases": [
    {
      "id": "exact-match-full",
      "cvSkills": ["Python", "PostgreSQL", "Docker"],
      "jobSkills": ["Python", "PostgreSQL", "Docker"],
      "expectedSkillsScore": { "min": 0.98, "max": 1.0 },
      "reason": "All skills match exactly"
    },
    {
      "id": "partial-match-70pct",
      "cvSkills": ["JavaScript", "React", "TypeScript"],
      "jobSkills": ["JavaScript", "React", "Vue", "CSS"],
      "expectedSkillsScore": { "min": 0.68, "max": 0.72 },
      "reason": "2 of 4 exact (accounting for CV skills not in job)"
    },
    {
      "id": "synonym-match",
      "cvSkills": ["Node.js"],
      "jobSkills": ["nodejs"],
      "expectedSkillsScore": { "min": 0.78, "max": 0.82 },
      "reason": "Synonym detected (tier 2), scored at 0.8x weight"
    },
    {
      "id": "fuzzy-typo",
      "cvSkills": ["Postgre"],
      "jobSkills": ["PostgreSQL"],
      "expectedSkillsScore": { "min": 0.48, "max": 0.52 },
      "reason": "Fuzzy match (Jaro-Winkler >= 0.85), scored at 0.5x weight"
    },
    {
      "id": "no-overlap-empty-cv",
      "cvSkills": [],
      "jobSkills": ["Python", "Java"],
      "expectedSkillsScore": { "min": 0.0, "max": 0.0 },
      "reason": "No CV skills"
    }
  ]
}
\\\

#### 6b. Regression Test Runner

Create /apps/api/test/matching.regression.spec.ts:

\\\	ypescript
describe('MatchingService Regression Suite', () => {
  const fixtures = require('./fixtures/matching-regressions.json');
  
  for (const testCase of fixtures.testCases) {
    it(testCase.id, () => {
      const score = service.calculateSkillsScore(
        testCase.cvSkills,
        testCase.jobSkills
      );
      expect(score).toBeGreaterThanOrEqual(testCase.expectedSkillsScore.min);
      expect(score).toBeLessThanOrEqual(testCase.expectedSkillsScore.max);
    });
  }
});
\\\

#### 6c. Real-World Corpus (20-50 cases)

Add edge cases:
- **Abbreviation handling**: "API", "CRUD", "RDD"
- **Version confusion**: "Python 3" vs "Python 3.9"
- **Acronyms**: "ML" (should NOT match "Multi-layer")
- **Framework variants**: "Express", "Express.js", "ExpressJS"
- **Whitespace issues**: "  Python  " (leading/trailing)
- **Mixed case**: "TypeScript", "typescript", "TYPESCRIPT"

#### 6d. Performance Regression Tests

Add to test suite:

\\\	ypescript
it('calculateSkillsScore completes in <10ms', () => {
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    service.calculateSkillsScore(largeSkillList, jobSkills);
  }
  const elapsed = performance.now() - start;
  expect(elapsed / 100).toBeLessThan(10); // avg <10ms per call
});
\\\

**Why**: Regression suite prevents silent degradation of match quality; provides baseline for A/B testing rollout.

---

## 7. PRODUCTION ROLLOUT STRATEGY

### Current State
- MVP on localhost only
- No canary/shadow testing capability
- Single matching algorithm (TF-IDF + skills)

### Recommendations

#### 7a. Feature Flag Architecture

Add to ScoreCombinerService:

\\\	ypescript
interface MatchingConfig {
  enableFuzzyMatching: boolean;        // Kill switch
  enableWeightedFamilies: boolean;     // Gradual rollout
  enableExplainableResults: boolean;   // UI feature flag
  fuzzyJaroThreshold: number;          // 0.75-0.85 tuning knob
  tfidfWeight: number;                 // 0.7 default, tunable
  skillsWeight: number;                // 0.3 default, tunable
}
\\\

Store in Job record OR env + Redis cache (for runtime re-config without restart).

#### 7b. Canary Release Plan

**Phase 1: Shadow Testing (Week 1)**
- Run **new matching algorithm** in parallel on 100% of requests
- Log both old + new scores to MatchAuditLog
- Recruiter sees only old score (UI unchanged)
- Monitor: score distribution shift, regression test pass rate

**Phase 2: Soft Rollout (Week 2, 20% traffic)**
- Enable new algorithm for 20% of job postings (new jobs only)
- Feature flag: MATCHING_v2_ENABLED_RATIO=0.2
- Recruiter feedback: "Does this match quality feel different?"
- Collect metrics: application rates, interview conversion

**Phase 3: Gradual Ramp (Week 3-4)**
- 50% → 75% → 100% over 2 weeks
- Abort condition: regression test fails OR recruiter satisfaction <80%
- Backoff to PhaseContext 2 if deployment issue detected

#### 7c. Monitoring & Metrics

Track in logs + observability:

\\\	ypescript
interface MatchingMetrics {
  matchScore: number;
  scoreChangeFromPrevious: number; // new - old
  componentsUsed: string[];        // ['tfidf', 'skills', 'families']
  tierCounts: { exact: n, family: n, fuzzy: n };
  recruitersActionedOnMatch: boolean;
  action: 'applied' | 'rejected' | 'interviewed' | null;
}
\\\

Dashboards:
- **Score distribution**: new vs old (should be similar, not bimodal)
- **Regression test health**: pass rate per test case
- **Recruiter action rate**: did new scores drive more interviews?
- **Latency**: new algorithm cost (~5ms added acceptable)

#### 7d. Rollback Plan

If rollout fails:
1. **Within 1 hour**: Revert feature flag to old algorithm
2. **Root cause analysis**: Regression test failure? Dependency issue?
3. **Fix + re-test locally** before next attempt
4. **Commit to main** only after passing regression + shadow test

**Why**: Candidate matching is trust-critical; canary prevents cascading bad matches to all Job postings.

---

## IMPLEMENTATION PRIORITY (Recommended Sequencing)

### High-Impact, Low-Effort (Start Here)

1. **Skill synonyms** (1-2 days)
   - 50-item dictionary + family grouping
   - Cost: ~50 lines JSON + 10 lines matching logic
   - ROI: +5-10% match recall

2. **Tier-based matching breakdown** (1 day)
   - Exact/family/fuzzy stratification
   - Cost: ~30 lines in SkillsCalculatorService
   - ROI: Sets foundation for explainability + feature flags

3. **Regression test corpus** (2-3 days)
   - 30-50 test cases covering edge cases
   - Cost: JSON fixtures + 20 lines test code
   - ROI: Prevents silent degradation

### Medium-Effort, High-Impact (Phase 2)

4. **Recruiter explainability** (3-4 days)
   - Extend MatchingResult schema
   - Update API response + UI detail panel
   - Cost: 100 lines backend + 200 lines React
   - ROI: Trust, audit trail, feedback loop

5. **Profile canonicalization** (2-3 days)
   - Two-tier normalization (preserve + canonical)
   - Schema migration: skills → skills { original, canonical }
   - Cost: DB migration + 30 lines normalizer update
   - ROI: Fixes style variants (10-15% recall gain)

### Lower-Priority (Phase 3)

6. **Weighted skill families** + Jaro-Winkler fuzzy matching
   - Cost: 4-5 days (new dependency, tuning)
   - ROI: +2-5% accuracy, but adds complexity
   - Defer until regression corpus proves value

7. **Feature flags + canary rollout** (2 days)
   - Required only when deploying beyond localhost
   - Cost: 50 lines feature flag middleware
   - ROI: Zero risk deployments

---

## RISK ASSESSMENT

### Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|---|---|---|
| Fuzzy matching too permissive (Jaro < 0.85) | High | Medium | Start 0.85, test with corpus first |
| Synonym overexpansion (false matches) | Medium | Medium | Curate dictionary manually, no auto-generation |
| Regression tests incomplete | High | Low | Add 10+ edge cases, update quarterly |
| Recruiter rejects new scores | Medium | High | Shadow test 1 week, gather feedback early |

---

## UNRESOLVED QUESTIONS

1. Does job.location field need expansion (region normalization)? Verify recruiter filtering needs.
2. Should skill difficulty weights differ (e.g., "ML" > "Python")? Depends on use case.
3. How often should regression corpus be updated? Recommend: quarterly or post-major-release.
4. Will Jaro-Winkler library introduce npm dependency issues? Check: bundle size, Native module needs.
5. Should audit logs persist to separate table or remain in applications.notes? Need data retention policy.

---

## Next Steps for Planner

1. Choose implementation phase (1-3 above)
2. Assign time estimates per team capacity
3. Create detailed phase files in plans/
4. Begin regression corpus curation (can run parallel to other work)
