# Phase 2: API Register/Login And JWT Strategy

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-auth-contract-and-security-baseline.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Implement auth module in NestJS with register/login endpoints and JWT guards.

## Key Insights

- Prisma service already global.
- `@nestjs/jwt` and `passport-jwt` deps already installed.
- Current API has only base controller; auth can be introduced cleanly.

## Requirements

### Functional

- `POST /auth/register`
- `POST /auth/login`
- JWT strategy + guard for protected endpoints.
- `GET /auth/me` for current authenticated user.

### Non-functional

- Input validation using `class-validator`.
- Consistent HTTP errors (`400`, `401`, `409`).
- Role and user id included in JWT payload.

## Architecture

```text
AuthController -> AuthService -> PrismaService
AuthService uses bcrypt + JwtService
JwtStrategy validates Bearer token -> request.user
RolesGuard (next phases) consumes request.user.role
```

## Related Code Files

### Files To Modify

- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/src/app.controller.spec.ts` (if shared bootstrap assumptions change)

### Files To Create

- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.constants.ts`
- `apps/api/src/auth/decorators/current-user.decorator.ts`
- `apps/api/src/auth/dto/register.dto.ts`
- `apps/api/src/auth/dto/login.dto.ts`
- `apps/api/src/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/auth/strategies/jwt.strategy.ts`

### Files To Delete

- None.

## Implementation Steps

1. Create `AuthModule` and wire `JwtModule.registerAsync` from config.
2. Implement `AuthService.register`:
   - check duplicate email
   - hash password
   - create user
   - for candidate role, auto-create candidate profile row.
3. Implement `AuthService.login`:
   - verify email exists and not soft deleted
   - compare bcrypt hash
   - issue JWT
4. Implement `AuthController` endpoints:
   - `POST /auth/register`
   - `POST /auth/login`
   - `GET /auth/me` with JWT guard
5. Add global `ValidationPipe` in bootstrap if missing.
6. Add shared auth response mapper to avoid password leaks.

## Todo List

- [x] Auth module scaffolded and imported.
- [x] Register endpoint working with role restrictions.
- [x] Login endpoint returns signed JWT and user payload.
- [x] JWT strategy and guard functioning.
- [x] `/auth/me` returns current user.
- [x] Validation and error mapping complete.

## Success Criteria

- [x] Register candidate/recruiter succeeds.
- [x] Duplicate email returns `409`.
- [x] Wrong credentials returns `401`.
- [x] Protected endpoint rejects missing/invalid token.
- [x] No password field appears in API responses.

## Risk Assessment

- **Risk:** bcrypt compare/hash cost affects local tests.
- **Mitigation:** moderate salt rounds for MVP, keep configurable.

## Security Considerations

- Use strong JWT secret.
- Token expiry enforced.
- Reject soft-deleted users at login.

## Next Steps

- Integrate NextAuth credentials provider with these endpoints (Phase 3).

## Unresolved Questions

- None.
