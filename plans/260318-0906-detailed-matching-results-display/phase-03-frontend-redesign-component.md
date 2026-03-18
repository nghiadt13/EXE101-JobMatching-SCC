# Phase 3: Frontend — Redesign Component

## Overview
- **Priority:** High (main deliverable)
- **Status:** Pending
- **Effort:** 1.5h

Complete rewrite of `matching-snapshot-v2.tsx` into a 3-section detailed view matching the reference screenshot.

## Related Code Files

| Action | File |
|--------|------|
| MODIFY | `apps/web/components/applications/matching-snapshot-v2.tsx` |

## Key Insights

- Existing `Badge` component supports variants: `default`, `primary`, `success`, `warning`, `danger`, `info`, `outline`
- `ConstraintFlags` component can remain as-is (only shown when constraints fail)
- Data already available in snapshot: `requirements[]` (with evidence, status, confidence), `constraints[]`, `candidateSummary` (headline, experience, skills, projects), `scoreBreakdown`

## Design — 3 Sections

### Section 1: Overall Fit Summary (always visible)

```
┌─────────────────────────────────────────────────────┐
│ [Good fit]  66% overall fit                         │
│                                                     │
│ The candidate's profile and CV explicitly list      │
│ Node.js as a core skill, directly matching the      │
│ requirement. This is further supported by...        │
│                                                     │
│ Best evidence: Backend Developer with over 3 years  │
│ of experience in API and microserv...               │
│                                                     │
│ Still unclear: deeper proof of microservices.        │
└─────────────────────────────────────────────────────┘
```

**Logic:**
- Badge color: `≥70% → success "Good fit"`, `40-69% → warning "Fair fit"`, `<40% → danger "Weak fit"`
- Description: candidate headline + top strengths joined
- Best evidence: first evidence string from highest-importance met requirement
- Still unclear: gaps list joined

### Section 2: How This Score Is Built (collapsible)

```
┌─────────────────────────────────────────────────────┐
│ HOW THIS SCORE IS BUILT                             │
│ The final fit blends skill score, constraint        │
│ compliance, experience, and project relevance       │
│                                                     │
│ [Final fit XX%]                                     │
│                                                     │
│ Skill Score  │ Constraint  │ Experience │ Project   │
│ XX/100       │ XX/100      │ XX/100     │ XX/100    │
│                                                     │
│ [XX months exp] [Location] [X projects]             │
└─────────────────────────────────────────────────────┘
```

**Logic:**  
- 4-column grid for score components
- Badge row from candidateSummary metadata

### Section 3: Why This Looks Relevant (collapsible)

```
┌─────────────────────────────────────────────────────┐
│ WHY THIS LOOKS RELEVANT                             │
│ Evidence pulled from the job requirements and CV    │
│                                                     │
│ [Direct match] [High confidence]                    │
│ Job asks for: Required skill: Node.js               │
│ CV evidence: Candidate profile: Backend Developer   │
│ with over 3 years of experience in API...           │
│                                                     │
│ [Partial match] [Medium confidence]                 │
│ Job asks for: Required skill: Docker                │
│ CV evidence: Docker mentioned in project X          │
│                                                     │
│ ... (more requirements)                             │
└─────────────────────────────────────────────────────┘
```

**Logic:**
- Sort requirements: met first (by importance desc), then partial, then missing
- Show top 8 most relevant
- Status badge: `met → success "Direct match"`, `partial → warning "Partial match"`, `missing → danger "Missing"`
- Confidence badge: `high → info`, `medium → default`, `low → outline`
- Each item shows: requirement label, evidence text, optional importance pill

## Implementation Steps

### Step 1: Create helper functions

```typescript
function getFitInfo(score: number) {
  if (score >= 70) return { text: 'Good fit', variant: 'success' as const, border: 'border-emerald-200', bg: 'bg-emerald-50' };
  if (score >= 40) return { text: 'Fair fit', variant: 'warning' as const, border: 'border-amber-200', bg: 'bg-amber-50' };
  return { text: 'Weak fit', variant: 'danger' as const, border: 'border-red-200', bg: 'bg-red-50' };
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'met': return { text: 'Direct match', variant: 'success' as const };
    case 'partial': return { text: 'Partial match', variant: 'warning' as const };
    case 'missing': return { text: 'Missing', variant: 'danger' as const };
    default: return { text: 'N/A', variant: 'default' as const };
  }
}

function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case 'high': return { text: 'High confidence', variant: 'info' as const };
    case 'medium': return { text: 'Medium confidence', variant: 'default' as const };
    default: return { text: 'Low confidence', variant: 'outline' as const };
  }
}

const IMPORTANCE_ORDER = { critical: 0, high: 1, medium: 2, low: 3, very_low: 4 };
const STATUS_ORDER = { met: 0, partial: 1, missing: 2, not_applicable: 3 };
```

### Step 2: Implement Section 1 — Overall Fit Summary

- Use `snapshot.scoreBreakdown.final` for score
- Use `getFitInfo()` for badge + card border color
- Show `candidateSummary.headline` + strengths as description
- Find best evidence from highest-importance met requirement
- Show gaps as "Still unclear" items

### Step 3: Implement Section 2 — Score Composition

- Use `useState` for expand/collapse
- Render 4-column grid with score values
- Show candidateSummary metadata as badges:
  - `{totalExperienceMonths} months total exp`
  - `{relevantExperienceMonths} months relevant`
  - Location if available
  - `{projectRelevance.totalProjects} projects`

### Step 4: Implement Section 3 — Evidence Details

- Use `useState` for expand/collapse
- Sort requirements by status then importance
- Render top 8 as evidence cards
- Each card: status badge, confidence badge, label, evidence text
- Also show constraint evaluations (if any failed)

### Step 5: Keep existing ConstraintFlags integration

- `ConstraintFlags` component stays as-is, rendered after Section 3

## Todo List

- [ ] Create helper functions (getFitInfo, getStatusInfo, getConfidenceBadge)
- [ ] Implement Section 1: Overall Fit Summary
- [ ] Implement Section 2: How This Score Is Built (collapsible)
- [ ] Implement Section 3: Why This Looks Relevant (collapsible)
- [ ] Keep ConstraintFlags + warnings at bottom
- [ ] Handle backward compat (old snapshots without labels)
- [ ] Verify responsive layout on mobile

## Success Criteria

- 3 distinct visual sections rendering with correct data
- Color-coded badges for fit level, status, confidence
- Sections 2 and 3 are expandable/collapsible
- Old snapshots without label fields still render (fallback to requirementId)
- Responsive on mobile viewports

## Edge Cases

| Case | Handling |
|------|----------|
| Old snapshot without `label` field | Use `requirementId` as fallback |
| Empty evidence array | Show "No evidence available" |
| All requirements missing | Section 3 shows all as "Missing" badges |
| 0 score | "Weak fit" badge, breakdown still visible |
| candidateSummary.location is null | Skip location badge |
| No projects (totalProjects=0) | Show "No projects" badge |
