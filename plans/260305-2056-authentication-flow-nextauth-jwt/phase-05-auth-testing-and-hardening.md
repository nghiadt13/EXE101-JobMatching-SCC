# Phase 5: Auth Testing And Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-register-login-jwt.md)
- [Phase 3](./phase-03-web-nextauth-credentials-integration.md)
- [Phase 4](./phase-04-auth-pages-and-route-protection.md)
- [Docs: Implementation Checklist](../../docs/05-implementation-checklist.md)

## Overview

**Priority:** P1  
**Status:** 🟨 In Progress  
**Estimate:** 1.5h

Validate auth flow end-to-end and close critical security/usability gaps for MVP.

## Key Insights

- API test setup already exists (unit + e2e jest).
- Web currently has no test framework; initial validation can be smoke/manual + lint/build.
- This phase focuses on confidence, not exhaustive test infra build.

## Requirements

### Functional

- Validate register/login/me endpoints with automated API tests.
- Validate web login/register flow manually with seeded users.
- Verify role data carried through session and route redirects.

### Non-functional

- No critical auth regressions.
- Clean error messages for common failures.
- Build and lint pass for touched apps.

## Architecture

```text
API tests -> AuthService/AuthController/JwtStrategy
Web checks -> form submit + session + redirect
Cross-check -> token from login accepted by /auth/me
```

## Related Code Files

### Files To Modify

- `apps/api/src/auth/auth.controller.spec.ts` (or split spec files)
- `apps/api/test/app.e2e-spec.ts`
- `apps/web/app/login/page.tsx`
- `apps/web/app/register/page.tsx`

### Files To Create

- `apps/api/src/auth/auth.service.spec.ts`
- `apps/api/src/auth/auth.e2e-spec.ts` (optional if preferred over app-level e2e file)
- `apps/web/docs/auth-smoke-checklist.md` (small manual test checklist)

### Files To Delete

- None.

## Implementation Steps

1. Add API unit tests for register/login service behaviors.
2. Add API integration/e2e tests for:
   - register success
   - duplicate email
   - login success/fail
   - `/auth/me` with and without token
3. Execute `npm run test`, `npm run test:e2e`, `npm run build`, `npm run lint` in API.
4. Execute `npm run build`, `npm run lint` in web.
5. Run manual smoke checklist for login/register/session redirects.
6. Fix any P1/P2 auth issues found before closing phase.

## Todo List

- [x] API auth unit tests added and passing.
- [x] API auth e2e tests added and passing.
- [x] Web build/lint passing after auth integration.
- [ ] Manual smoke checklist written and executed.
- [x] Critical auth issues fixed.

## Success Criteria

- [x] Auth acceptance criteria from plan are all met.
- [x] API and web compile/build without auth-related errors.
- [ ] No blocker found in login/register/protected-route flow.

## Risk Assessment

- **Risk:** Missing frontend automated tests can hide regressions.
- **Mitigation:** strict smoke checklist + keep scope small + add UI tests in next iteration.

## Security Considerations

- Verify invalid/expired token denied by API.
- Verify register/login endpoints sanitize inputs.
- Confirm no credentials/tokens logged in plaintext.

## Next Steps

- Move to next planned feature: User Management APIs and pages.

## Unresolved Questions

- Manual browser smoke execution for login/register/session redirects is still pending.
