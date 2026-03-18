# Phase 2: Frontend — Update Types

## Overview
- **Priority:** High (blocks component redesign)
- **Status:** Pending
- **Effort:** 10min

Update the `MatchingSnapshotV2` type definition in the frontend to match the enriched backend response.

## Related Code Files

| Action | File |
|--------|------|
| MODIFY | `apps/web/lib/applications-client.ts` |

## Implementation Steps

### Step 1: Add fields to `requirements` array type

In `applications-client.ts` (~line 47-52):

```diff
 requirements: Array<{
   requirementId: string;
+  label: string;
+  importance: 'critical' | 'high' | 'medium' | 'low' | 'very_low';
+  category: string;
   status: 'met' | 'partial' | 'missing' | 'not_applicable';
   evidence: string[];
   confidence: 'high' | 'medium' | 'low';
 }>;
```

### Step 2: Add `label` to `constraints` array type

In `applications-client.ts` (~line 53-57):

```diff
 constraints: Array<{
   constraintId: string;
+  label: string;
   met: boolean;
   evidence: string;
 }>;
```

## Todo List

- [ ] Add `label`, `importance`, `category` to requirements array type
- [ ] Add `label` to constraints array type
- [ ] Verify no TypeScript errors in web app

## Success Criteria

- Frontend types match backend `MatchingSnapshotV2` response
- No TypeScript compilation errors
