# Phase 1: CV Contract And Upload Security Baseline

## Context Links

- [Plan Overview](./plan.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)
- [Docs: Implementation Checklist](../../docs/05-implementation-checklist.md)
- [Previous Plan: User Management](../260305-2141-user-management-admin-profile-rbac/plan.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Lock endpoint contracts and abuse controls before coding CV APIs.

## Key Insights

- Prisma schema already has `CV` model with `parsedData`, `skills`, and `isPrimary`.
- API already has `JwtAuthGuard` and `RolesGuard` to enforce candidate-only access.
- `pdf-parse`, `mammoth`, and `multer` already exist in API dependencies.
- Current docs define CV endpoints but not strict security/error behavior.

## Requirements

### Functional

- Finalize candidate-only contracts for:
  - `POST /cvs/upload`
  - `GET /cvs`
  - `GET /cvs/:id`
  - `PATCH /cvs/:id`
  - `DELETE /cvs/:id`
  - `POST /cvs/:id/set-primary`
- Define upload policy:
  - Allowed types: PDF, DOCX only.
  - Max file size: 5 MB.
  - Max active CVs per candidate: 10 (soft-deleted excluded).
- Define primary rule: exactly one `isPrimary = true` CV when candidate has at least one active CV.
- Define editable parsed fields and sanitize behavior.

### Non-functional

- Consistent status codes (`400`, `401`, `403`, `404`, `409`, `413`, `415`, `422`).
- Error messages safe for user, no internal path leak.
- Contract must stay aligned with current Prisma schema (no migration in this phase).

## Architecture

```text
Client (candidate) -> CV Controller (auth + role guard)
-> upload validation (mime/size/count)
-> CV Service contract methods
-> Prisma + file storage + parsing pipeline
```

## Related Code Files

### Files To Modify

- `docs/03-api-endpoints.md`
- `docs/05-implementation-checklist.md`

### Files To Create

- None (contract definition phase only).

### Files To Delete

- None.

## Implementation Steps

1. Define final request/response contracts for all `/cvs` endpoints.
2. Define upload abuse controls (mime, extension, size, count limit).
3. Define candidate ownership checks for all CV resource operations.
4. Define primary switching behavior for set-primary and delete flows.
5. Define error-code matrix and invalid-state handling.
6. Update docs to reflect exact contract and constraints.

## Todo List

- [ ] `/cvs` contracts finalized and documented.
- [ ] Upload security policy documented.
- [ ] Status-code and error matrix documented.
- [ ] Primary CV invariants documented.

## Success Criteria

- [ ] No ambiguity for backend/frontend implementation.
- [ ] Security policy is explicit and testable.
- [ ] Contract aligns with existing schema and auth model.

## Risk Assessment

- **Risk:** Contract drift between API implementation and docs.
- **Mitigation:** Update docs first and reference contracts in DTO/types.

## Security Considerations

- Enforce server-side candidate ownership checks only.
- Reject path traversal attempts by never trusting original file paths.
- Avoid exposing `filePath` to client responses.

## Next Steps

- Implement CV module and storage flow using this baseline.

## Unresolved Questions

- None.
