# Phase 1: Auth Intent Capture and Redirect Continuity

## Context Links

- Parent: [plan.md](./plan.md)
- Relevant files:
  - `../../apps/web/app/login/page.tsx`
  - `../../apps/web/components/auth/login-form.tsx`
  - `../../apps/web/app/jobs/[slug]/page.tsx`
  - `../../apps/web/app/page.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: stop losing user intent when a protected action forces login.

## Key Insights

- `login-form.tsx` currently signs in with `redirect: false` and always pushes `/dashboard`.
- Job detail already emits `callbackUrl`, but login does not consume it.
- If intent is lost at login, every downstream continuity fix becomes less credible.

## Requirements

Functional:

- Read incoming `callbackUrl` on the login route.
- Pass `callbackUrl` into the login form.
- After successful login, navigate to `callbackUrl` when it is present and safe, else keep current role-based default behavior.
- Preserve intent for entrypoints already generating `callbackUrl` today.

Non-functional:

- Do not change auth provider config.
- Do not change RBAC redirects for invalid roles.
- Reject unsafe external redirect targets.

## Architecture

Use a thin pass-through pattern:

`login page search params -> login form prop -> sign-in success router target`

Do not add a new auth abstraction layer. That is wasted motion for this fix.

## Related Code Files

Modify:

- `apps/web/app/login/page.tsx`
- `apps/web/components/auth/login-form.tsx`
- `apps/web/app/jobs/[slug]/page.tsx`

Review only:

- `apps/web/app/page.tsx`

## Implementation Steps

1. Inspect how the login page receives search params in App Router.
2. Thread `callbackUrl` from page to form as an explicit prop.
3. On successful sign-in, prefer the safe callback target over hardcoded `/dashboard`.
4. Verify the existing job-detail login links use the same query key and encoding.
5. Confirm fallback behavior for plain `/login` still lands on the role dashboard.

## Todo List

- [ ] Read `callbackUrl` in login page.
- [ ] Pass `callbackUrl` into login form.
- [ ] Honor `callbackUrl` after successful sign-in.
- [ ] Guard against unsafe redirect targets.

## Success Criteria

- Login from job-detail intent returns to that same job detail page.
- Plain login still resolves to the correct dashboard.
- No auth rules or provider behavior are changed.

## Risk Assessment

- Risk: open-redirect bug.
- Mitigation: only allow internal relative paths.

## Security Considerations

- Treat redirect targets as untrusted input.
- Never allow absolute external URLs.

## Next Steps

- Use the recovered auth intent as the base for jobs-route continuity in Phase 2.