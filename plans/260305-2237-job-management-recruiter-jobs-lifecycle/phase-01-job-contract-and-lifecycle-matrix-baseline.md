# Phase 1: Job Contract And Lifecycle Matrix Baseline

## Context Links

- [Plan Overview](./plan.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)
- [CV Plan](../260305-2213-cv-management-upload-parsing-security/plan.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Lock job API contracts, role matrix, and status transition rules before coding jobs module.

## Key Insights

- Prisma schema already has `Job` model and `JobStatus` enum.
- No `jobs` module currently exists in API/web codebase.
- Auth/RBAC primitives already exist (`JwtAuthGuard`, `RolesGuard`, `@Roles`).

## Requirements

### Functional

- Finalize contracts for:
  - `POST /jobs` (recruiter only)
  - `GET /jobs` (public published OR recruiter own all)
  - `GET /jobs/:id` (role-sensitive visibility)
  - `PATCH /jobs/:id` (recruiter owner only)
  - `DELETE /jobs/:id` (recruiter owner only, soft delete)
  - `POST /jobs/:id/publish`
  - `POST /jobs/:id/close`
- Define status transition matrix:
  - `DRAFT -> PUBLISHED` allowed
  - `PUBLISHED -> CLOSED` allowed
  - all other transitions blocked
- Define slug strategy (`title` -> slug + collision handling).

### Non-functional

- No leak of soft-deleted jobs by default.
- Stable error codes (`400`, `401`, `403`, `404`, `409`).
- Public list/detail never expose recruiter private draft data.

## Architecture

```text
Controller -> Jwt guard (optional by route) + role checks
-> JobsService -> slug service + transition guard
-> Prisma Job table (soft delete + ownership filtering)
```

## Related Code Files

### Files To Modify

- `docs/03-api-endpoints.md`
- `docs/05-implementation-checklist.md`

### Files To Create

- None (contract phase).

### Files To Delete

- None.

## Implementation Steps

1. Freeze request/response shapes for all job endpoints.
2. Define lifecycle transition rules and failure responses.
3. Define recruiter/public visibility matrix for list/detail.
4. Define slug uniqueness behavior and duplicate fallback.
5. Update docs with contract and status-code matrix.

## Todo List

- [ ] Job endpoint contracts finalized.
- [ ] Lifecycle matrix finalized.
- [ ] Visibility matrix finalized.
- [ ] Slug strategy documented.

## Success Criteria

- [ ] No contract ambiguity for API/web implementation.
- [ ] Transition and visibility rules are testable.

## Risk Assessment

- **Risk:** scope confusion between recruiter and public reads.
- **Mitigation:** explicit matrix by endpoint + role.

## Security Considerations

- Ownership checks server-side only.
- Draft/closed visibility restricted to recruiter owner and admin if needed.

## Next Steps

- Implement jobs CRUD and scoped reads in API.

## Unresolved Questions

- None.
