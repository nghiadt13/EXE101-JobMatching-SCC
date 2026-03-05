# Phase 2: API Users Admin CRUD

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-contract-and-rbac-matrix.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)

## Overview

**Priority:** P1  
**Status:** ⬜ Pending  
**Estimate:** 3h

Implement admin-only users CRUD APIs with pagination, filtering, and soft-delete.

## Key Insights

- `User` model already supports soft-delete via `deletedAt`.
- Auth stack already has JWT guard and current user payload.
- No user module exists yet, clean module scaffold possible.

## Requirements

### Functional

- `GET /users` with pagination and role/search filters.
- `GET /users/:id` for user detail.
- `PATCH /users/:id` update name/avatar/role (no password in this phase).
- `DELETE /users/:id` soft-delete user.

### Non-functional

- Admin-only access via RBAC.
- Default exclude `deletedAt != null`.
- Return stable DTO responses without password field.

## Architecture

```text
UsersController (@Roles ADMIN) -> UsersService -> Prisma user queries
Soft delete = set deletedAt timestamp
```

## Related Code Files

### Files To Modify

- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth.module.ts` (if guard export needed)
- `apps/api/src/auth/guards/roles.guard.ts`

### Files To Create

- `apps/api/src/users/users.module.ts`
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/users/users.service.ts`
- `apps/api/src/users/dto/query-users.dto.ts`
- `apps/api/src/users/dto/update-user.dto.ts`
- `apps/api/src/users/users.types.ts`

### Files To Delete

- None.

## Implementation Steps

1. Scaffold `UsersModule`, controller, service.
2. Add list DTO: `page`, `limit`, `search`, `role`, `includeDeleted` (optional admin debug).
3. Implement list query with `skip/take`, `orderBy createdAt desc`.
4. Implement get-by-id filtered by `deletedAt: null` by default.
5. Implement update with allowed fields only.
6. Implement soft-delete by setting `deletedAt`.
7. Block self-delete explicitly (`currentUser.id === targetUserId` -> `400`).
8. Apply `JwtAuthGuard` + `RolesGuard` + `@Roles('ADMIN')` on users routes.

## Todo List

- [ ] Users module wired in app module.
- [ ] List/get/update/delete endpoints implemented.
- [ ] Pagination/filtering and response mapping implemented.
- [ ] Password excluded from all responses.
- [ ] RBAC admin-only enforced.
- [ ] Self-delete blocked at API service layer.

## Success Criteria

- [ ] Non-admin gets `403` on all `/users` endpoints.
- [ ] Admin can query users with filters and pagination.
- [ ] Soft-deleted users not returned by default.
- [ ] Update/delete flows return expected API codes.

## Risk Assessment

- **Risk:** accidental self-delete/admin role lockout during local testing.
- **Mitigation:** block self-delete in service with explicit validation.

## Security Considerations

- Never expose `password`.
- Validate `role` updates against enum.
- Keep update whitelist strict.

## Next Steps

- Implement profile APIs for all authenticated users.

## Unresolved Questions

- None.
