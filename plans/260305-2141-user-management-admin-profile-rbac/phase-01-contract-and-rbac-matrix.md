# Phase 1: Contract And RBAC Matrix

## Context Links

- [Plan Overview](./plan.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)
- [Auth Plan](../260305-2056-authentication-flow-nextauth-jwt/plan.md)

## Overview

**Priority:** P1  
**Status:** ⬜ Pending  
**Estimate:** 1.5h

Lock API contracts and role matrix before coding users/profile modules.

## Key Insights

- JWT payload already includes `role`, usable for route RBAC.
- Current API has `JwtAuthGuard`, no role guard yet.
- `User.deletedAt` soft-delete exists, must be respected in all user/profile reads.

## Requirements

### Functional

- Define `/users` contract for list/get/update/delete (admin only).
- Define `/profile` contract for get/update current user.
- Define RBAC matrix per endpoint and HTTP method.

### Non-functional

- No password/hash leak in any response.
- Consistent error codes: `401`, `403`, `404`, `409`.
- RBAC checks must not depend on client-side role.

## Architecture

```text
JwtAuthGuard -> request.user (sub, role)
RolesGuard + @Roles(...) -> authorization gate
Users/Profile controllers -> services -> Prisma
```

## Related Code Files

### Files To Modify

- `apps/api/src/auth/auth.types.ts`
- `apps/api/src/auth/guards/jwt-auth.guard.ts` (if typing tweaks needed)
- `apps/api/src/app.module.ts`
- `docs/03-api-endpoints.md`

### Files To Create

- `apps/api/src/auth/decorators/roles.decorator.ts`
- `apps/api/src/auth/guards/roles.guard.ts`
- `apps/api/src/auth/auth-role.types.ts` (optional shared role typing)

### Files To Delete

- None.

## Implementation Steps

1. Write endpoint payload/response contracts for `/users` and `/profile`.
2. Define RBAC matrix:
   - `users/*`: `ADMIN` only
   - `profile/*`: any authenticated role
3. Add `@Roles` decorator and `RolesGuard` to enforce role checks.
4. Document contracts and status codes in `docs/03-api-endpoints.md`.
5. Keep response shape aligned with current auth/user types.

## Todo List

- [ ] `/users` and `/profile` contract finalized.
- [ ] `@Roles` decorator and `RolesGuard` design finalized.
- [ ] RBAC matrix documented.
- [ ] Error behavior documented.

## Success Criteria

- [ ] No ambiguity for phase 2-4 implementation.
- [ ] Role matrix maps clearly to every endpoint.
- [ ] Contract consistent with Prisma schema and current auth payload.

## Risk Assessment

- **Risk:** Guard ordering mistakes lead to false `403`/`401`.
- **Mitigation:** Always run `JwtAuthGuard` before `RolesGuard`.

## Security Considerations

- Authorization checks server-side only.
- Deny by default when role metadata missing for protected admin routes.
- Return generic unauthorized messages where needed.

## Next Steps

- Build users admin CRUD module using this contract and RBAC matrix.

## Unresolved Questions

- None.
