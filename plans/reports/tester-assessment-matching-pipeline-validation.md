# Validation Quality Assessment: Matching Pipeline Foundation Changes

**Date:** 2026-03-07  
**Scope:** Recent matching-pipeline foundation changes including canonical skill atoms, matchingSnapshot, deterministic atomization/canonicalization, dual-write, fallback reads, and web client updates  
**Status:** Mixed - Strong core tests, critical coverage gaps in key components

---

## Executive Summary

**All 52 API tests pass (100% pass rate)**, and the project builds successfully with no compilation errors. However, **critical validation gaps exist** in recently-added components essential for the matching pipeline foundation. Key infrastructure (skill storage adapter, AI normalization, web client) lacks adequate test coverage. Before broader rollout, these gaps must be addressed.

---

## Test Results Overview

| Metric | Result |
|--------|--------|
| Total Tests | 52 passed |
| Pass Rate | 100% ✓ |
| Test Suites | 14 passed |
| Overall Coverage | 47.29% statements |
| Build Status | ✓ Success |
| Lint Status | ✓ Passing (pre-confirmed) |

### Coverage by Component

| Component | Statements | Branches | Functions | Status |
|-----------|-----------|----------|-----------|--------|
| **Matching Service** | 90% | 79.48% | 88.46% | ✓ Good |
| **Calculators** (TF-IDF, Skills, Score) | 94.79% | 85% | 100% | ✓ Excellent |
| **Skill Atomizer** | 97.14% | 83.33% | 100% | ✓ Excellent |
| **Skill Canonicalizer** | 93.33% | 75% | 100% | ✓ Good |
| **Skill Storage Adapter** | 34.61% | 13.79% | 25% | ⚠️ CRITICAL GAP |
| **CVs Service** | 37.34% | 27.2% | 40% | ⚠️ CRITICAL GAP |
| **Normalization** (AI, Gemini) | 9.62% | 3.22% | 0% | ⚠️ CRITICAL GAP |
| **Jobs Service** | 65.53% | 47.36% | 70.83% | ⚠️ Gap |
| **Applications Service** | 50.58% | 31.5% | 61.11% | ⚠️ Gap |
| **Web App** | 0% | 0% | 0% | ⚠️ NO TESTS |

---

## Critical Validation Gaps

### 1. **SkillStorageAdapterService** (34.61% coverage) 🔴

**Criticality:** HIGH - This service is the backbone of canonical skill atom operations

**What's NOT tested:**
- `readSkillAtoms()` - JSON deserialization of stored skill atoms
  - Invalid/corrupted JSON handling
  - Empty/null JSON values
  - Type coercion and validation
  - Malformed atom objects (missing required fields)
- `toStoredSkills()` - Model transformation
  - Duplicate skill normalization
  - Source field assignment and validation
  - Large skill list handling (array slicing at 100)
- `deriveFromLegacySkills()` - Fallback read pathway
  - Atomization of legacy string arrays
  - Source field set to 'legacy'
- Private utility methods for JSON/string extraction

**Risk:** Skill atoms may not persist/retrieve correctly, breaking match determinism

---

### 2. **AI Normalization Services** (9.62% coverage) 🔴

**Criticality:** HIGH - Foundation for parsing CV/JD and populating normalized profiles

**What's NOT tested:**
- `AiNormalizationService`:
  - CV normalization flow (`normalizeCv()`)
  - Job normalization flow (`normalizeJob()`)
  - Fallback logic when Gemini API fails
  - JSON repair mechanism (`tryRepairJson()`)
  - Skill dictionary mapping
  - Telemetry collection (source, latency, fallback flags)
  - Schema version handling
  - Parse status estimation
- `GeminiClientService`:
  - Actual Gemini API communication
  - Error handling for API failures
  - Response parsing

**Risk:** Unvalidated parsing flow; AI fallbacks untested; no assurance normalized data matches schema

---

### 3. **CVs Service** (37.34% coverage) 🔴

**Criticality:** HIGH - Executes dual-write and fallback reads for skill atoms

**What's NOT tested:**
- `update()` method:
  - Manual skill updating with atomization
  - Skill atom dual-write (`skills` + `skillAtoms`)
  - Parsed data merging logic
  - Syncing normalized profile with new skills
  - Transaction safety
- `upload()` method:
  - Full skill atomization during file upload
  - Skill atom storage in create operation
  - File storage rollback on failure
  - Fallback parsing flow
- `softDelete()` transaction:
  - CV cascade behavior
  - Primary CV fallback logic

**Risk:** Manual skill updates may not atomize correctly; fallback reads may return stale data

---

### 4. **Jobs Service** (65.53% coverage) 🔴

**Criticality:** HIGH - Similar dual-write pattern as CVs

**What's NOT tested:**
- `create()` method:
  - Skill atom storage during creation
  - Normalization metadata in location field
- `createFromFile()` method:
  - Full end-to-end document upload → normalization → atomization
  - Draft job creation from uploaded candidates
- `updateSkills()` method:
  - Dual skill/skillAtom update
- `update()` method:
  - Skill atom updates

**Risk:** Jobs may have missing or stale skill atoms, affecting match consistency

---

### 5. **Web Application** (0% coverage) 🔴

**Criticality:** MEDIUM - No test infrastructure exists

**What exists but is untested:**
- Additive skill atom type rendering (new SkillAtom interface)
- Matching snapshot display in application view
- CV/Job skill atom UI components
- Fallback read pathway in web client (if any)

**Risk:** Web UI may not properly display canonical skills or matching snapshots

---

### 6. **Applications Service & Matching Integration** (50.58% coverage) ⚠️

**Criticality:** MEDIUM - Partial coverage of matchingSnapshot

**What's NOT tested:**
- `create()` method:
  - End-to-end application creation with matchingSnapshot capture
  - Matching payload extraction
- `findByIdArbitraryRead()` (if exists):
  - Fallback read pathway for applications
- Matching snapshot structure validation:
  - componentScores accuracy
  - topMatchedSkills extraction
  - warnings propagation

**Risk:** matchingSnapshot may not accurately reflect match state; queries may fail

---

## Validated Components (Strong Coverage)

✓ **Skill Atomizer** (97.14%): ✓ **Skill Canonicalizer** (93.33%):Comprehensive canonicalization rules tested
✓ **Matching Service Core** (90%): Matching logic, fallback read pathways via skills/skillAtoms
✓ **Score Calculators** (94.79%): TF-IDF, skills matching, score combination all well-tested

---

## Missing Integration Tests

### Category: Controller & End-to-End Tests
- **Zero controller test coverage** (0% across all controllers)
- No HTTP-level validation of:
  - Skill atom payloads in API responses
  - MatchingSnapshot in application GET responses
  - Dual-write consistency via API
  - Fallback read behavior over HTTP

### Category: Fallback Read Pathways
- Matching service tests cover fallback logic but assume mock data
- No tests verify actual async fallback when `cv.skillAtoms` is null/empty
- No tests verify dual-read strategy (stored atoms → legacy normalization → legacy skills)

### Category: Determinism
- No tests verify that same CV + Job always produce identical scores across multiple calls
- No tests verify skill deduplication produces consistent canonical forms

---

## High-Value Tests Missing Before Rollout

### Priority 1: Must Have (Blocking Issues)
1. **SkillStorageAdapterService spec** (15+ tests)
   - readSkillAtoms JSON parsing (valid/invalid/empty)
   - toStoredSkills integration with atomizer
   - deriveFromLegacySkills fallback pathway
   
2. **CVs update + dual-write flow** (8+ tests)
   - Manual skill update → skillAtoms creation
   - Fallback scenario: old CV with only skills → matching uses legacy atoms
   - Transaction rollback on failure
   
3. **Jobs update + dual-write flow** (8+ tests)
   - Manual job skill update → skillAtoms creation
   - Document upload → normalization → atomization
   
4. **Matching fallback reads** (6+ tests)
   - Matching with CV/Job missing skillAtoms (uses fallback)
   - Matching version resolution ('v2' vs 'legacy')
   - Warning generation when parsing flagged for review

### Priority 2: Should Have (Coverage Improvement)
1. **AI Normalization service** (12+ tests)
   - Successful CV/JD normalization flow
   - Fallback when API fails
   - Skill list extraction from normalized profile
   
2. **Applications service integration** (6+ tests)
   - Application creation captures matchingSnapshot
   - Snapshot reflects component scores
   - Recruiter queries filter by job ownership
   
3. **Canonicalization determinism** (5+ tests)
   - Same input always produces same canonical form
   - Deduplication consistency (Postgres vs PostgreSQL → 1 atom)
   - Whitespace/case normalization edge cases

### Priority 3: Nice to Have (Full Coverage)
1. **Web component tests** (TBD - requires Jest/Vitest setup)
   - Skill atom rendering
   - MatchingSnapshot display
   - Fallback indicator in UI
2. **E2E tests** for dual-write and fallback scenarios
3. **Document storage services** (27.58% coverage)

---

## Test Execution Quality

✓ All tests are **deterministic** (pass consistently)
✓ All tests **run in isolation** (no interdependencies)
✓ **No mocked database** transactions - good signal for unit tests ✓ **Async operations properly awaited**
⚠️ **Heavy mocking** may hide real integration issues
⚠️ **No database integration tests** - schema changes untested

---

## Risk Assessment

### Deployment Risk: **MEDIUM-HIGH**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Skill atoms not persisting | Matching breaks; all v2 matches fail | **MEDIUM** | Add SkillStorageAdapter tests |
| Fallback reads fail silently | Legacy scores incorrect; scores unstable | **MEDIUM** | Test fallback pathways in matching |
| Normalization produces invalid atoms | Canonical form mismatches | **LOW** (97%+ atomizer coverage) | Normalize test data |
| Dual-write consistency lost | Partial atom data in DB | **MEDIUM** | Test update transaction handling |
| Web misses new SkillAtom type | UI breaks or doesn't display atoms | **MEDIUM** | Add web component tests |

---

## Recommendations

### Immediate (Before Rollout)

1. **Create SkillStorageAdapterService.spec.ts** (15 tests)
   - Cover all public methods + JSON edge cases
   - Estimated time: 2-3 hours
   
2. **Add CVs dual-write tests** (8 tests)
   - Mock skillStorageAdapter and verify both fields written
   - Test fallback read scenario
   - Estimated time: 2 hours
   
3. **Add Jobs dual-write tests** (8 tests)
   - Similar to CVs
   - Estimated time: 2 hours
   
4. **Add matching fallback read tests** (6 tests)
   - Test skill atom → legacy skill fallback
   - Test matching version resolution
   - Estimated time: 1.5 hours

**Total estimated effort:** 7-8.5 hours

### Short Term (Post-Rollout, Phase 1)

5. Create `AiNormalizationService.spec.ts` (12+ tests)
6. Create `ApplicationsService` integration tests (6+ tests)
7. Add canonicalization determinism tests (5+ tests)
8. Set up web component test infrastructure (Jest/Vitest)

### Medium Term (Phase 2)

9. Controller integration tests (REST API validation)
10. Database integration tests with real Prisma
11. E2E tests for complete CV → Matching → Application flow
12. Web component tests for SkillAtom rendering

---

## Validation Readiness Checklist

- [x] Build command succeeds
- [x] Lint passes
- [x] Unit tests pass (52/52)
- [x] Core matching logic tested (90% coverage)
- [x] Score calculators verified (95%+ coverage)
- [ ] Skill storage adapter tested
- [ ] Dual-write flows tested
- [ ] Fallback read pathways tested
- [ ] AI normalization flow tested
- [ ] MatchingSnapshot structure tested
- [ ] Controllers tested
- [ ] Web component tests (not applicable yet - no framework)
- [ ] E2E tests complete
- [ ] Database integration tests

---

## Summary

The matching pipeline foundation has **solid core logic** (matching service 90%, calculators 95%), but **critical gaps in supporting infrastructure** (skill storage 34%, normalization 9%, CVs/Jobs coverage moderate). These gaps directly impact reliability of the canonical skill atom flow and dual-write pattern.

**Approval for rollout:** CONDITIONAL - High-priority tests muststop before broader deployment. With 7-8.5 hours of focused testing, the validation quality can reach acceptable levels (>80% coverage on all critical paths).

**Key blockers for rollout:**
1. SkillStorageAdapterService must be tested (dual-write backbone)
2. CVs/Jobs update operations must validate skill atom creation
3. Matching fallback reads must work when atoms missing
