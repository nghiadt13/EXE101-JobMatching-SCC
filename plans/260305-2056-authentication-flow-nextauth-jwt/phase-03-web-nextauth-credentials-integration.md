# Phase 3: Web NextAuth Credentials Integration

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-register-login-jwt.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Integrate NextAuth v5 in `apps/web` using credentials provider backed by NestJS login API.

## Key Insights

- `next-auth` dependency already installed.
- Web app is still minimal starter; no auth files exist yet.
- API login contract can be canonical source for auth state.

## Requirements

### Functional

- Configure NextAuth with credentials provider.
- Call backend login API in `authorize`.
- Persist user id/role/token in JWT/session callbacks.
- Expose sign-in/sign-out helpers for client/server usage.

### Non-functional

- Keep token out of URL/query.
- Type-safe session typing in TypeScript.
- Fail closed on invalid auth response.

## Architecture

```text
Login form -> NextAuth signIn("credentials")
NextAuth authorize -> POST api/auth/login
Success -> session JWT contains { userId, role, accessToken }
App routes consume session via auth() / useSession()
```

## Related Code Files

### Files To Modify

- `apps/web/package.json` (only if small supporting deps needed)

### Files To Create

- `apps/web/auth.ts`
- `apps/web/auth.config.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `apps/web/types/next-auth.d.ts`
- `apps/web/lib/api-client.ts`

### Files To Delete

- None.

## Implementation Steps

1. Create `auth.config.ts` with credentials provider fields (`email`, `password`).
2. In `authorize`, call NestJS `/auth/login`, validate response, map user object.
3. Add NextAuth callbacks:
   - `jwt` callback stores `userId`, `role`, `accessToken`.
   - `session` callback exposes safe user/session fields.
4. Add typed API client for base URL and error normalization.
5. Create auth route handler `app/api/auth/[...nextauth]/route.ts`.
6. Add `next-auth` module augmentation for custom fields.

## Todo List

- [x] NextAuth config created.
- [x] Credentials authorize calls backend login successfully.
- [x] JWT/session callbacks map fields correctly.
- [x] Route handler for NextAuth active.
- [x] Type augmentation compiles.

## Success Criteria

- [x] User can sign in with backend credentials.
- [x] Session includes role and user id.
- [x] Invalid credentials surface clear UI-safe message.
- [x] Build passes with strict typing.

## Risk Assessment

- **Risk:** mismatch between NextAuth beta API and code examples.
- **Mitigation:** keep config minimal and align to installed v5 beta signatures.

## Security Considerations

- Never expose raw backend error details to UI.
- Store only required claims in session/JWT.
- Prefer httpOnly/session-managed flow via NextAuth.

## Next Steps

- Build actual login/register pages and route protection in Phase 4.

## Unresolved Questions

- None.
