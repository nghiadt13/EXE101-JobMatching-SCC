# Phase 1: Auth Contracts And Security Baseline

## Context Links

- [Plan Overview](./plan.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 1.5h

Define API contract and security baseline before coding auth handlers.

## Key Insights

- `User` model already has `email`, `password`, `role`; enough for credentials MVP.
- API docs already define register/login response shape with token.
- Existing API has Prisma wired, so auth module can be added directly.

## Requirements

### Functional

- Finalize request/response DTO contract for register/login.
- Define JWT payload shape (`sub`, `email`, `role`).
- Define role rules for signup (candidate/recruiter only from public register).

### Non-functional

- Password must be hashed with bcrypt.
- Secret-based JWT signing with env config.
- No secret leakage in logs/responses.

## Architecture

```text
Web (NextAuth credentials) -> NestJS /auth/login
NestJS AuthService -> Prisma user lookup/create
NestJS JwtService -> signed access token
Web session <- mapped from API response
```

## Related Code Files

### Files To Modify

- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts` (CORS + prefix if needed)
- `apps/api/.env` (JWT variables)

### Files To Create

- `apps/api/src/auth/auth.types.ts`
- `apps/api/src/auth/dto/register.dto.ts`
- `apps/api/src/auth/dto/login.dto.ts`

### Files To Delete

- None.

## Implementation Steps

1. Define auth API contract matching `docs/03-api-endpoints.md`.
2. Add/confirm env keys: `JWT_SECRET`, `JWT_EXPIRES_IN`.
3. Set payload schema and token expiry policy for MVP.
4. Define role rules:
   - Register accepts `CANDIDATE` or `RECRUITER`.
   - `ADMIN` created by seed/manual only.
5. Define error contract for invalid credentials/email conflict.

## Todo List

- [x] Auth DTO contract written.
- [x] JWT payload contract documented in code.
- [x] Env vars defined and validated.
- [x] Role policy fixed for register endpoint.
- [x] Error response shape decided.

## Success Criteria

- [x] Team can implement auth without ambiguity.
- [x] Contract aligns with existing docs and Prisma schema.
- [x] Security baseline is explicit and enforceable.

## Risk Assessment

- **Risk:** Contract drift between web and API.
- **Mitigation:** Keep DTO + response types shared conceptually and stable.

## Security Considerations

- Never return hashed password.
- Generic login failure message to avoid account enumeration.
- JWT secret required at app boot for non-test env.

## Next Steps

- Move to Phase 2 implementation for NestJS auth module.

## Unresolved Questions

- None.
