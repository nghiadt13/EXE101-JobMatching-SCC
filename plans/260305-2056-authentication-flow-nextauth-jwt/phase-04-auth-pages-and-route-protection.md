# Phase 4: Auth Pages And Route Protection

## Context Links

- [Plan Overview](./plan.md)
- [Phase 3](./phase-03-web-nextauth-credentials-integration.md)
- [Docs: Tổng Quan](../../docs/01-tong-quan.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Build login/register UI and basic protected routing with role-aware redirects.

## Key Insights

- UI is still default starter page, no existing routes to preserve.
- MVP requires 3 roles but only candidate/recruiter self-register.
- Admin account is seeded and login-only.

## Requirements

### Functional

- `/login` page with email/password form.
- `/register` page with name/email/password/role.
- Submit register to backend then sign in automatically.
- Protected app area route (initial `/dashboard` placeholder).
- Redirect authenticated users away from `/login` and `/register`.

### Non-functional

- Basic input validation with zod/react-hook-form.
- Clear loading/error states.
- Mobile-usable layout.

## Architecture

```text
/register -> backend /auth/register -> NextAuth signIn -> /dashboard
/login -> NextAuth signIn -> role redirect
middleware/auth wrapper checks session on protected routes
```

## Related Code Files

### Files To Modify

- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

### Files To Create

- `apps/web/app/login/page.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/middleware.ts` (or auth.ts route matcher approach)
- `apps/web/components/auth/login-form.tsx`
- `apps/web/components/auth/register-form.tsx`
- `apps/web/lib/auth-redirect.ts`

### Files To Delete

- None.

## Implementation Steps

1. Create reusable form components for login/register.
2. Wire register form to backend API, then call NextAuth sign-in.
3. Wire login form to NextAuth credentials sign-in.
4. Create dashboard placeholder page for post-login redirect target.
5. Add route protection middleware for `/dashboard` and future protected paths.
6. Add role-based redirect helper:
   - Admin -> `/dashboard/admin` (placeholder allowed)
   - Recruiter -> `/dashboard/recruiter` (placeholder allowed)
   - Candidate -> `/dashboard/candidate` (placeholder allowed)

## Todo List

- [x] Login page functional.
- [x] Register page functional for candidate/recruiter.
- [x] Authenticated redirect logic added.
- [x] Protected route guard active.
- [x] Basic dashboard landing route exists.

## Success Criteria

- [x] Unauthenticated user cannot access dashboard route.
- [x] User can register then land in authenticated area.
- [x] User can login with seeded account.
- [x] Sign-out returns user to public page/login.

## Risk Assessment

- **Risk:** Route guard conflicts with Next.js App Router behavior.
- **Mitigation:** keep matcher small and verify with manual route checks.

## Security Considerations

- Do not trust client role for authorization decisions.
- Sensitive actions still must enforce role on backend.
- Avoid exposing access token in rendered markup.

## Next Steps

- Execute test plan and hardening in Phase 5.

## Unresolved Questions

- None.
