# Phase 3: API Profile Endpoints

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-contract-and-rbac-matrix.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)

## Overview

**Priority:** P1  
**Status:** ⬜ Pending  
**Estimate:** 2h

Implement current-user profile APIs for authenticated users.

## Key Insights

- `GET /auth/me` already exists; profile APIs should extend this for editable profile data.
- Candidate extra fields live in `Candidate` table, not `User` table.
- Recruiter/Admin profile can stay on `User` table fields for MVP.

## Requirements

### Functional

- `GET /profile`: return own user profile (+ candidate extension when role is candidate).
- `PATCH /profile`: update own profile fields.
- Candidate can update `phone`, `location`, `bio`; all roles can update `name`, `avatar`.

### Non-functional

- Must use authenticated user from JWT (`sub`).
- Input validation with DTOs.
- Clear `404` when profile row not found (edge case data inconsistency).

## Architecture

```text
ProfileController (@UseGuards JwtAuthGuard) -> ProfileService
ProfileService -> Prisma user + candidate (role-based read/write)
```

## Related Code Files

### Files To Modify

- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth.controller.ts` (optional me/profile harmonization)

### Files To Create

- `apps/api/src/profile/profile.module.ts`
- `apps/api/src/profile/profile.controller.ts`
- `apps/api/src/profile/profile.service.ts`
- `apps/api/src/profile/dto/update-profile.dto.ts`
- `apps/api/src/profile/profile.types.ts`

### Files To Delete

- None.

## Implementation Steps

1. Scaffold `ProfileModule`, controller, service.
2. Implement `GET /profile` with role-aware payload:
   - base user fields for all roles
   - candidate extension for candidate users.
3. Implement `PATCH /profile`:
   - update user fields always
   - update candidate fields only when role is candidate.
4. Validate JSON-like location payload shape for candidate updates.
5. Keep response sanitized and consistent with web consumption.

## Todo List

- [ ] Profile module wired.
- [ ] `GET /profile` implemented.
- [ ] `PATCH /profile` implemented.
- [ ] Candidate extension data handled safely.
- [ ] DTO validation complete.

## Success Criteria

- [ ] Any authenticated user can read own profile.
- [ ] Candidate can update candidate-specific fields.
- [ ] Recruiter/Admin cannot overwrite candidate-only fields.
- [ ] No password/hash leak in profile responses.

## Risk Assessment

- **Risk:** inconsistent data when candidate relation missing for candidate role.
- **Mitigation:** explicit guard + clear error; optional create relation in controlled path.

## Security Considerations

- Update only own profile, ignore client-provided user id.
- Sanitize and validate update payload.
- Preserve RBAC boundaries for role-specific fields.

## Next Steps

- Connect web admin/users and profile pages to these APIs.

## Unresolved Questions

- None.
