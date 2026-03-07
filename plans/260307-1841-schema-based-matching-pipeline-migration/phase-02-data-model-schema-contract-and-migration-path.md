# Phase 2: Data Model, Schema Contract, And Migration Path

## Context Links

- [Plan Overview](./plan.md)
- [Prisma Schema](../../apps/api/prisma/schema.prisma)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)
- [Applications Service](../../apps/api/src/applications/applications.service.ts)
- [Schema Migration](../../apps/api/prisma/migrations/20260307193000_add_schema_matching_contract_fields/migration.sql)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 5h

Define the persisted contract for JD requirements schema, CV candidate profile, and application evaluation snapshot. Use additive schema changes first; delete old fields only after rollout proves stable.

## Key Insights

- Current DB already relies on JSON for parsed payloads, so schema v1 should stay JSON-based for speed and migration safety.
- `matchScore` should remain the stable sortable numeric field.
- `tfidfScore` and `skillsScore` should be deprecated, not repurposed.

## Requirements

### Functional

- Add a durable requirements schema on `Job`.
- Add a durable candidate profile on `CV`.
- Define a new schema-based `matchingSnapshot` version for `Application`.
- Preserve existing rows and mixed-version reads during rollout.

### Non-Functional

- Keep migration additive first.
- Avoid introducing overly normalized relational tables for v1.

## Proposed Persistence Shape

Job:

- `requirementsSchema Json?`
- `requirementsSchemaVersion String?`

CV:

- `candidateProfile Json?`
- `candidateProfileVersion String?`

Application:

- keep `matchScore Float`
- keep `matchingSnapshot Json?`, but allow `version: 'schema_v1'`
- keep `tfidfScore` / `skillsScore` nullable during transition, then delete in final cleanup migration

## Snapshot Direction

```json
{
  "version": "schema_v1",
  "scoreBreakdown": {
    "mustHave": 0.0,
    "niceToHave": 0.0,
    "experience": 0.0,
    "education": 0.0,
    "location": 0.0,
    "final": 82
  },
  "requirements": [
    {
      "id": "req-1",
      "label": "3+ years Node.js",
      "category": "experience",
      "importance": "must_have",
      "status": "met|partial|missing",
      "evidence": ["Backend engineer at X, 2021-2025"]
    }
  ],
  "strengths": ["Strong TypeScript backend evidence"],
  "gaps": ["No Kubernetes evidence"],
  "warnings": []
}
```

## Related Code Files

### Files To Modify

- `apps/api/prisma/schema.prisma`
- `apps/api/src/jobs/jobs.types.ts`
- `apps/api/src/cvs/cvs.types.ts`
- `apps/api/src/applications/applications.types.ts`
- `apps/web/lib/jobs-client.ts`
- `apps/web/lib/cv-client.ts`
- `apps/web/lib/applications-client.ts`

### Files To Create

- Prisma migration for additive schema fields
- Shared schema type files for requirements/profile/evaluation DTOs

### Files To Delete

- None in this phase

## Implementation Steps

1. Define `requirementsSchema_v1`, `candidateProfile_v1`, and `applicationEvaluation_v1` TypeScript contracts.
2. Add additive Prisma fields for job and CV schema payloads plus version tags.
3. Extend application snapshot typing to support both old and new versions.
4. Keep old score columns readable until rollout completes.
5. Define mixed-version read behavior in API responses:
   - old application -> old snapshot renderer
   - new application -> schema snapshot renderer
6. Define final cleanup migration as a separate release step, not bundled with v1 launch.

## Todo List

- [ ] Additive data model approved.
- [ ] Snapshot v1 contract locked.
- [ ] Mixed-version response strategy documented.
- [ ] Final drop-column cleanup deferred to post-cutover phase.

## Success Criteria

- Backend and frontend can both type-check mixed old/new records without ambiguity.
- Migration path does not require rewriting all historical applications before first release.

## Risk Assessment

- **Risk:** JSON shapes drift across services.
- **Mitigation:** central shared type/validator module and strict version tags.

## Security Considerations

- Evaluation snapshot must store evidence snippets, not raw full CV text blocks.

## Next Steps

- Build JD extraction against the locked schema, not ad hoc parsed fields.

## Unresolved Questions

- None.