# Phase 4: Web Admin Users And Profile Pages

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-users-admin-crud.md)
- [Phase 3](./phase-03-api-profile-endpoints.md)
- [Auth Plan](../260305-2056-authentication-flow-nextauth-jwt/plan.md)

## Overview

**Priority:** P1  
**Status:** ⬜ Pending  
**Estimate:** 3h

Implement admin users management page and user profile page in Next.js app.

## Key Insights

- Web already has role-aware dashboard routes and NextAuth session.
- Access token already mapped into session and can call backend APIs.
- UI currently minimal, so adding focused MVP pages is low-risk.

## Requirements

### Functional

- Admin page: `/dashboard/admin/users` list/search/filter users.
- Profile page: `/dashboard/profile` read/update current profile.
- Enforce route-level access:
  - only admin can access admin users page.
  - all authenticated roles can access profile page.

### Non-functional

- Client validation for profile update form.
- Loading/error states for API interactions.
- Keep role/security checks server-side as source of truth.

## Architecture

```text
Server components read session -> fetch API with bearer token
Client forms submit to route handlers/server actions or direct fetch wrappers
RBAC still enforced by backend even if UI hides actions
```

## Related Code Files

### Files To Modify

- `apps/web/app/dashboard/admin/page.tsx`
- `apps/web/app/dashboard/recruiter/page.tsx`
- `apps/web/app/dashboard/candidate/page.tsx`
- `apps/web/lib/api-client.ts`
- `apps/web/lib/auth-redirect.ts`
- `apps/web/middleware.ts`

### Files To Create

- `apps/web/app/dashboard/admin/users/page.tsx`
- `apps/web/app/dashboard/profile/page.tsx`
- `apps/web/components/users/admin-users-table.tsx`
- `apps/web/components/profile/profile-form.tsx`
- `apps/web/lib/users-client.ts`
- `apps/web/lib/profile-client.ts`

### Files To Delete

- None.

## Implementation Steps

1. Add API client helpers for `/users` and `/profile` with bearer token.
2. Implement admin users page:
   - table/list
   - role/search filters
   - basic user update/delete actions inline (MVP simple UI, no detail page).
3. Implement profile page/form for current user.
4. Update dashboard entry points with links to new pages.
5. Validate admin page access and profile access through middleware + server checks.

## Todo List

- [ ] Admin users page created and API-connected.
- [ ] Profile page created and API-connected.
- [ ] UI states for loading/error/success implemented.
- [ ] Route protection verified.
- [ ] Role-based actions constrained in UI.

## Success Criteria

- [ ] Admin can view and manage users from web.
- [ ] Non-admin blocked from admin users page.
- [ ] All roles can view/update own profile.
- [ ] Profile updates reflected immediately after save.

## Risk Assessment

- **Risk:** stale session/access token handling causes false unauthorized.
- **Mitigation:** centralize auth header injection and normalize API errors.

## Security Considerations

- Do not render secrets/tokens in markup.
- Keep destructive actions behind confirmation.
- Backend remains final authorization layer.

## Next Steps

- Validate with API tests, web checks, and RBAC smoke matrix.

## Unresolved Questions

- None.
