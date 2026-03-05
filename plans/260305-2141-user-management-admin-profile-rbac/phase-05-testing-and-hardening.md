# Phase 5: Testing And Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-users-admin-crud.md)
- [Phase 3](./phase-03-api-profile-endpoints.md)
- [Phase 4](./phase-04-web-admin-users-and-profile-pages.md)
- [Docs: Implementation Checklist](../../docs/05-implementation-checklist.md)

## Overview

**Priority:** P1  
**Status:** ⬜ Pending  
**Estimate:** 2.5h

Validate users/profile flows, RBAC boundaries, and regression stability.

## Key Insights

- API test setup exists and can extend quickly for users/profile modules.
- Web has lint/build checks but no full automated UI test stack yet.
- RBAC is primary risk area; negative cases are mandatory.

## Requirements

### Functional

- API tests for users CRUD + profile endpoints.
- RBAC tests for Admin/Recruiter/Candidate access boundaries.
- Web smoke checks for admin users page and profile page flows.

### Non-functional

- No critical auth/RBAC regressions.
- Lint/build clean in touched apps.
- Errors are user-safe and status-code correct.

## Architecture

```text
Unit tests -> service logic
E2E tests -> guards + controllers + status codes
Web checks -> page access + form submit + redirect behavior
```

## Related Code Files

### Files To Modify

- `apps/api/test/app.e2e-spec.ts`
- `apps/api/src/users/*.spec.ts` (or consolidated)
- `apps/web/docs/auth-smoke-checklist.md`

### Files To Create

- `apps/api/src/users/users.service.spec.ts`
- `apps/api/src/profile/profile.service.spec.ts`
- `apps/web/docs/user-management-smoke-checklist.md`

### Files To Delete

- None.

## Implementation Steps

1. Add API unit tests for users/profile services.
2. Add API e2e tests:
   - admin allowed on `/users`
   - recruiter/candidate denied on `/users`
   - authenticated roles allowed on `/profile`
3. Run `lint`, `test`, `test:e2e`, `build` for API.
4. Run `lint`, `build` for web.
5. Execute manual smoke checklist:
   - admin users list/filter/update/delete
   - profile update per role
   - RBAC redirect and forbidden behavior.

## Todo List

- [ ] Unit tests for users/profile added.
- [ ] E2E RBAC matrix tests added.
- [ ] API lint/test/build passing.
- [ ] Web lint/build passing.
- [ ] Manual smoke checklist written and executed.

## Success Criteria

- [ ] Users/profile acceptance criteria all pass.
- [ ] RBAC negative cases verified.
- [ ] No blocker in admin-users/profile flows.
- [ ] Docs/checklist updated to reflect completion.

## Risk Assessment

- **Risk:** missing UI automation can hide regressions.
- **Mitigation:** strict smoke checklist + prioritize API e2e RBAC coverage.

## Security Considerations

- Verify forbidden routes always return `403`.
- Verify deleted users not exposed in active user views.
- Ensure no sensitive fields leak from user/profile responses.

## Next Steps

- Proceed to CV management plan after user management closes.

## Unresolved Questions

- None.
